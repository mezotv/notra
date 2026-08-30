import { describeContentBillingDenial } from "@notra/ai/billing/content-billing";
import { FEATURES } from "@notra/ai/billing/features";
import { DEFAULT_LANGUAGE } from "@notra/ai/constants/languages";
import { geoLog } from "@notra/ai/evlog";
import { gateway } from "@notra/ai/gateway";
import type { AgentTokenUsage } from "@notra/ai/types/agents";
import { EMPTY_GEO_CHECK_GROUNDING } from "@notra/db/constants/geo-checks";
import { db } from "@notra/db/drizzle";
import {
  brandSettings,
  geoPromptSequences,
  geoPrompts,
  geoSettings,
} from "@notra/db/schema";
import type {
  GeoCheckSourceItem,
  GeoCheckWrite,
} from "@notra/db/types/geo-checks";
import { insertGeoMentionChecks } from "@notra/db/utils/geo-checks";
import { generateText, type ModelMessage, Output, stepCountIs } from "ai";
import { and, asc, eq } from "drizzle-orm";
import { Effect, Ref, Semaphore } from "effect";

import {
  GEO_ANSWER_MAX_TOKENS,
  GEO_ANSWER_SYSTEM_PROMPT,
  GEO_CURSOR_TIMEOUT_MS,
  GEO_EXCERPT_MAX_LENGTH,
  GEO_GROUNDED_ANSWER_MAX_TOKENS,
  GEO_GROUNDED_MAX_PROMPTS,
  GEO_JUDGE_MAX_TOKENS,
  GEO_JUDGE_MODEL,
  GEO_LANGUAGE_GROUNDED_MAX_PROMPTS,
  GEO_LANGUAGE_MAX_PROMPTS,
  GEO_MAX_LANGUAGES,
  GEO_MAX_PROMPTS,
  GEO_MAX_SEQUENCES,
  GEO_SCAN_CONCURRENCY,
  GEO_SCAN_LEASE_HEARTBEAT_MS,
  GEO_SEQUENCE_MAX_TURNS,
  GEO_TRANSLATION_MAX_TOKENS,
} from "../constants/geo";
import { GeoContentBillingService } from "../deps";
import {
  geoJudgeResultSchema,
  geoTranslationResultSchema,
} from "../schemas/geo";
import type {
  GeoCheckContext,
  GeoCheckOutcome,
  GeoCheckTask,
  GeoEngineAnswer,
  GeoGroundedAnswer,
  GeoGroundedEngine,
  GeoJudgeResult,
  GeoModelGateway,
  GeoPromptDefinition,
  GeoProjectScanOutcome,
  GeoScanResult,
  GeoScopeInput,
  GeoSequenceCheckOutcome,
  GeoSequenceDefinition,
  GeoSequenceRunResponse,
  GeoSettingsRow,
  GeoSkipFields,
  GeoZdrMode,
} from "../types/geo";
import {
  resolveGeoEngineGateway,
  resolveGeoZdrMode,
} from "../utils/geo-engines";
import {
  describeGeoError,
  flushGeoLogEffect,
  geoLogError,
  geoLogInfo,
  geoLogWarn,
  logGeoSkip,
} from "../utils/geo-log";
import {
  isGeoScanRunning,
  summarizeGeoEngineAttempts,
} from "../utils/geo-scan";
import { askCursorEngine } from "./cursor";
import { geoSkip } from "./effect";
import { buildGroundedInvocation, resolveGroundedEngines } from "./engines";
import {
  GeoEmptyAnswerError,
  GeoJudgeError,
  GeoScanError,
  GeoSequenceEmptyError,
  GeoSequenceNotFoundError,
  GeoSequenceRunError,
  GeoSequenceRunUnavailableError,
  GeoSettingsMissingError,
  GeoTranslationError,
  GeoWriterCreditsExhaustedError,
} from "./errors";
import { extractGrounding } from "./grounding";
import { toGeoSettings } from "./mappers";
import { loadGeoModelCatalog } from "./model-catalog";
import { requireGeoProject } from "./projects";
import { buildGeoPrompts, customPromptScanId } from "./prompts";
import {
  claimGeoScanRun,
  failPendingGeoScanRow,
  markGeoScanFinished,
  releaseGeoScanRun,
  renewGeoScanRun,
  withGeoScanRun,
} from "./scan-status";

const MAX_JUDGE_COMPETITORS = 10;
const GROUNDED_MAX_STEPS = 4;

function sequencePromptId(sequenceId: string): string {
  return `sequence-${sequenceId}`;
}

function sequenceTurnCount(sequence: GeoSequenceDefinition): number {
  return Math.min(sequence.steps.length, GEO_SEQUENCE_MAX_TURNS);
}

function checkFailureFields(
  context: GeoCheckContext,
  task: GeoCheckTask
): GeoSkipFields {
  return {
    event: "geo.check.failed",
    organizationId: context.organizationId,
    projectId: context.projectId,
    scanId: context.scanId,
    engine: task.engine,
    promptId: task.prompt.id,
    language: task.language,
    grounded: task.grounded !== null,
  };
}

function sequenceFailureFields(
  context: GeoCheckContext,
  sequence: GeoSequenceDefinition,
  grounded: GeoGroundedEngine
): GeoSkipFields {
  return {
    event: "geo.check.failed",
    organizationId: context.organizationId,
    projectId: context.projectId,
    scanId: context.scanId,
    engine: grounded.key,
    promptId: sequencePromptId(sequence.id),
    sequenceId: sequence.id,
    language: DEFAULT_LANGUAGE,
    grounded: true,
  };
}

function droppedCheckOutcome(
  fields: GeoSkipFields,
  error: GeoEmptyAnswerError
): GeoCheckOutcome {
  logGeoSkip("check failed", fields, error);
  return {
    row: null,
    usage: error.usage
      ? addTokenUsage(EMPTY_TOKEN_USAGE, error.usage)
      : EMPTY_TOKEN_USAGE,
  };
}

function maintainGeoScanClaim(
  projectId: string,
  claim: Ref.Ref<Date>,
  lock: Semaphore.Semaphore
) {
  const heartbeat = lock.withPermit(
    Effect.gen(function* () {
      const current = yield* Ref.get(claim);
      const renewed = yield* renewGeoScanRun(projectId, current);
      if (!renewed) {
        return yield* Effect.fail(
          new GeoScanError({
            message: `Lost the scan claim for project ${projectId}`,
          })
        );
      }
      yield* Ref.set(claim, renewed.claimedAt);
    })
  );

  return Effect.sleep(GEO_SCAN_LEASE_HEARTBEAT_MS).pipe(
    Effect.andThen(heartbeat),
    Effect.forever
  );
}

function normalizePosition(position: number | null): number | null {
  if (position === null || !Number.isFinite(position)) {
    return null;
  }
  const rounded = Math.round(position);
  return rounded >= 1 ? rounded : null;
}

function buildJudgePrompt(
  context: GeoCheckContext,
  promptText: string,
  answer: string
): string {
  const aliasList =
    context.aliases.length > 0 ? context.aliases.join(", ") : "none";
  return `Company: ${context.companyName}
Known aliases (any of these counts as a mention): ${aliasList}

A user asked an AI assistant:
"""
${promptText}
"""

The assistant answered:
"""
${answer}
"""

Analyze the answer and report:
- mentioned: true if the company or any alias appears in the answer.
- position: the 1-based rank of the company among the recommended brands if the answer contains an ordered or bulleted list of brands, otherwise null.
- sentiment: the sentiment expressed toward the company ("positive", "neutral" or "negative"), or null if it is not mentioned.
- competitors: up to ${MAX_JUDGE_COMPETITORS} other brand or product names mentioned in the answer, excluding the company and its aliases.
- excerpt: at most ${GEO_EXCERPT_MAX_LENGTH} characters of the answer around the mention, or the first 200 characters of the answer if the company is not mentioned.

The answer may be written in any language or script; count mentions of the company or its aliases regardless of language.`;
}

const askGatewayEngine = Effect.fn("geo.askGatewayEngine")(function* (
  organizationId: string,
  engine: string,
  promptText: string,
  zdr: GeoZdrMode,
  gatewayPin: Exclude<GeoModelGateway, "cursor"> | undefined
) {
  const result = yield* Effect.tryPromise({
    try: () =>
      generateText({
        model: gateway(engine, {
          organizationId,
          zdr,
          gateway: gatewayPin,
        }),
        prompt: promptText,
        system: GEO_ANSWER_SYSTEM_PROMPT,
        maxOutputTokens: GEO_ANSWER_MAX_TOKENS,
      }),
    catch: (cause) =>
      new GeoScanError({
        message: `Engine ${engine} failed to answer`,
        cause,
      }),
  });
  const answer: GeoEngineAnswer = {
    text: result.text,
    grounding: extractGrounding(result),
    finishReason: result.finishReason,
    usage: result.usage,
  };
  return answer;
});

/**
 * Cursor is not hosted on any AI gateway, so it runs through the local Cursor
 * SDK instead of `generateText`. Zero data retention is irrelevant here: the
 * catalog marks the engine as non-ZDR and approval is handled upstream.
 */
const askCursorEngineEffect = Effect.fn("geo.askCursorEngine")(function* (
  engine: string,
  promptText: string
) {
  const text = yield* askCursorEngine(promptText).pipe(
    Effect.mapError(
      (cause) =>
        new GeoScanError({
          message: `Engine ${engine} failed to answer`,
          cause,
        })
    ),
    Effect.timeoutOrElse({
      duration: GEO_CURSOR_TIMEOUT_MS,
      orElse: () =>
        Effect.fail(
          new GeoScanError({
            message: `Engine ${engine} timed out after ${GEO_CURSOR_TIMEOUT_MS}ms`,
          })
        ),
    })
  );
  const answer: GeoEngineAnswer = {
    text,
    grounding: EMPTY_GEO_CHECK_GROUNDING,
    finishReason: null,
  };
  return answer;
});

const askEngine = Effect.fn("geo.askEngine")(function* (
  organizationId: string,
  engine: string,
  promptText: string,
  zdr: GeoZdrMode,
  gatewayPin: GeoModelGateway | undefined
) {
  if (gatewayPin === "cursor") {
    return yield* askCursorEngineEffect(engine, promptText);
  }
  return yield* askGatewayEngine(
    organizationId,
    engine,
    promptText,
    zdr,
    gatewayPin
  );
});

function collectGroundedSources(
  sources: Awaited<ReturnType<typeof generateText>>["sources"]
): GeoCheckSourceItem[] {
  const seen = new Set<string>();
  const collected: GeoCheckSourceItem[] = [];
  for (const source of sources) {
    if (source.sourceType !== "url" || seen.has(source.url)) {
      continue;
    }
    seen.add(source.url);
    collected.push({ url: source.url, title: source.title ?? null });
  }
  return collected;
}

const askGroundedConversation = Effect.fn("geo.askGroundedConversation")(
  function* (
    organizationId: string,
    engine: GeoGroundedEngine,
    messages: ModelMessage[],
    zdr: GeoZdrMode
  ) {
    const result = yield* Effect.tryPromise({
      try: () => {
        const invocation = buildGroundedInvocation(engine, {
          organizationId,
          zdr,
        });
        return generateText({
          model: invocation.model,
          tools: invocation.tools,
          stopWhen: stepCountIs(GROUNDED_MAX_STEPS),
          messages,
          system: GEO_ANSWER_SYSTEM_PROMPT,
          maxOutputTokens: GEO_GROUNDED_ANSWER_MAX_TOKENS,
        });
      },
      catch: (cause) =>
        new GeoScanError({
          message: `Grounded engine ${engine.key} failed to answer`,
          cause,
        }),
    });
    const answer: GeoGroundedAnswer = {
      text: result.text,
      grounding: extractGrounding(result),
      finishReason: result.finishReason,
      sources: collectGroundedSources(result.sources),
      usage: result.usage,
    };
    return answer;
  }
);

const judgeAnswer = Effect.fn("geo.judgeAnswer")(function* (
  context: GeoCheckContext,
  promptText: string,
  answer: string
) {
  const result = yield* Effect.tryPromise({
    try: () =>
      generateText({
        model: gateway(GEO_JUDGE_MODEL, {
          organizationId: context.organizationId,
        }),
        output: Output.object({ schema: geoJudgeResultSchema }),
        prompt: buildJudgePrompt(context, promptText, answer),
        system:
          "You analyze AI assistant answers for brand mentions. Respond only with the requested structured data.",
        maxOutputTokens: GEO_JUDGE_MAX_TOKENS,
      }),
    catch: (cause) =>
      new GeoJudgeError({ message: "Judge model failed", cause }),
  });
  const judged: GeoJudgeResult = result.output;
  return judged;
});

const translatePrompts = Effect.fn("geo.translatePrompts")(function* (
  organizationId: string,
  language: string,
  prompts: GeoPromptDefinition[]
) {
  const result = yield* Effect.tryPromise({
    try: () =>
      generateText({
        model: gateway(GEO_JUDGE_MODEL, { organizationId }),
        output: Output.object({ schema: geoTranslationResultSchema }),
        prompt: `Translate each prompt into ${language}. Keep brand and product names unchanged. Return the translations in the same order.\n\n${JSON.stringify(prompts.map((prompt) => prompt.text))}`,
        system:
          "You translate user prompts faithfully, preserving intent and named entities. Respond only with the requested structured data.",
        maxOutputTokens: GEO_TRANSLATION_MAX_TOKENS,
      }),
    catch: (cause) =>
      new GeoTranslationError({
        message: `Translation to ${language} failed`,
        language,
        cause,
      }),
  });
  const translations = result.output.translations;
  if (translations.length !== prompts.length) {
    return yield* Effect.fail(
      new GeoTranslationError({
        message: `Translation to ${language} returned ${translations.length} prompts, expected ${prompts.length}`,
        language,
      })
    );
  }
  return prompts.map((prompt, index) => ({
    id: prompt.id,
    text: translations[index] ?? prompt.text,
  }));
});

const requireAnswerText = Effect.fn("geo.requireAnswerText")(function* (
  engine: string,
  promptId: string,
  language: string,
  answer: GeoEngineAnswer
) {
  if (answer.text.trim().length > 0) {
    return answer.text;
  }
  return yield* Effect.fail(
    new GeoEmptyAnswerError({
      message: `Engine ${engine} returned an empty answer`,
      engine,
      promptId,
      language,
      finishReason: answer.finishReason,
      usage: answer.usage,
    })
  );
});

const runGeoCheck = Effect.fn("geo.runCheck")(function* (
  context: GeoCheckContext,
  task: GeoCheckTask
) {
  const grounded = task.grounded
    ? yield* askGroundedConversation(
        context.organizationId,
        task.grounded,
        [{ role: "user", content: task.prompt.text }],
        task.zdr
      )
    : null;
  const answer =
    grounded ??
    (yield* askEngine(
      context.organizationId,
      task.engine,
      task.prompt.text,
      task.zdr,
      resolveGeoEngineGateway(context.catalog, task.engine)
    ));
  const answerText = yield* requireAnswerText(
    task.engine,
    task.prompt.id,
    task.language,
    answer
  );
  const judged = yield* judgeAnswer(context, task.prompt.text, answerText);
  const usage = answer.usage
    ? addTokenUsage(EMPTY_TOKEN_USAGE, answer.usage)
    : EMPTY_TOKEN_USAGE;

  const row: GeoCheckWrite = {
    organizationId: context.organizationId,
    projectId: context.projectId,
    scanId: context.scanId,
    engine: task.engine,
    promptId: task.prompt.id,
    sequenceId: null,
    turn: 0,
    prompt: task.prompt.text,
    answer: answerText,
    capturedAt: context.capturedAt,
    mentioned: judged.mentioned,
    position: normalizePosition(judged.position),
    sentiment: judged.sentiment,
    competitors: judged.competitors.slice(0, MAX_JUDGE_COMPETITORS),
    excerpt: judged.excerpt.slice(0, GEO_EXCERPT_MAX_LENGTH),
    grounding: answer.grounding,
    language: task.language,
    sources: grounded?.sources ?? [],
  };

  const outcome: GeoCheckOutcome = { row, usage };
  return outcome;
});

const runGeoScanForProject = Effect.fn("geo.runScanProject")(function* (
  settingsRow: GeoSettingsRow,
  scanId: string,
  runId: string
) {
  const startedAt = Date.now();
  const organizationId = settingsRow.organizationId;
  const catalog = yield* loadGeoModelCatalog(organizationId);

  const settings = toGeoSettings(settingsRow, catalog);

  const brand = yield* Effect.tryPromise({
    try: () =>
      db.query.brandSettings.findFirst({
        columns: { companyDescription: true, audience: true },
        where: and(
          eq(brandSettings.organizationId, organizationId),
          eq(brandSettings.isDefault, true)
        ),
      }),
    catch: (cause) =>
      new GeoScanError({ message: "Failed to load brand settings", cause }),
  });

  const customRows = yield* Effect.tryPromise({
    try: () =>
      db.query.geoPrompts.findMany({
        columns: { id: true, prompt: true },
        where: and(
          eq(geoPrompts.projectId, settingsRow.projectId),
          eq(geoPrompts.enabled, true)
        ),
        orderBy: [asc(geoPrompts.createdAt)],
      }),
    catch: (cause) =>
      new GeoScanError({ message: "Failed to load GEO prompts", cause }),
  });

  const autoPrompts = buildGeoPrompts(
    settings,
    brand
      ? {
          companyDescription: brand.companyDescription,
          audience: brand.audience,
        }
      : null
  ).slice(0, GEO_MAX_PROMPTS);

  const prompts: GeoPromptDefinition[] = [
    ...autoPrompts,
    ...customRows.map((row) => ({
      id: customPromptScanId(row.id),
      text: row.prompt,
    })),
  ];

  const context: GeoCheckContext = {
    organizationId,
    projectId: settingsRow.projectId,
    scanId,
    catalog,
    capturedAt: new Date(),
    companyName: settings.companyName,
    aliases: settings.aliases,
  };

  const zdrPolicy = {
    enforceZdr: settings.enforceZdr,
    nonZdrApprovedEngines: settings.nonZdrApprovedEngines,
  };
  const trackedEngines: { engine: string; zdr: GeoZdrMode }[] = [];
  for (const engine of new Set(settings.engines)) {
    const zdr = resolveGeoZdrMode(catalog, engine, zdrPolicy);
    if (zdr === null) {
      yield* geoLogWarn({
        event: "geo.scan.skipped",
        reason: "zdr",
        organizationId,
        projectId: settingsRow.projectId,
        scanId,
        engine,
      });
      continue;
    }
    trackedEngines.push({ engine, zdr });
  }
  const scanEnglish = settings.languages.includes(DEFAULT_LANGUAGE);
  const tasks: GeoCheckTask[] = [];
  if (scanEnglish) {
    for (const { engine, zdr } of trackedEngines) {
      for (const prompt of prompts) {
        tasks.push({
          engine,
          grounded: null,
          prompt,
          language: DEFAULT_LANGUAGE,
          zdr,
        });
      }
    }
  }

  const groundedEngines: { grounded: GeoGroundedEngine; zdr: GeoZdrMode }[] =
    [];
  for (const grounded of resolveGroundedEngines()) {
    const zdr = resolveGeoZdrMode(catalog, grounded.model, zdrPolicy);
    if (zdr === null) {
      yield* geoLogWarn({
        event: "geo.scan.skipped",
        reason: "zdr",
        organizationId,
        projectId: settingsRow.projectId,
        scanId,
        engine: grounded.key,
      });
      continue;
    }
    groundedEngines.push({ grounded, zdr });
  }
  const groundedPrompts = scanEnglish
    ? prompts.slice(0, GEO_GROUNDED_MAX_PROMPTS)
    : [];
  for (const { grounded, zdr } of groundedEngines) {
    for (const prompt of groundedPrompts) {
      tasks.push({
        engine: grounded.key,
        grounded,
        prompt,
        language: DEFAULT_LANGUAGE,
        zdr,
      });
    }
  }

  const extraLanguages = settings.languages
    .filter((language) => language !== DEFAULT_LANGUAGE)
    .slice(0, GEO_MAX_LANGUAGES);
  const localizedByLanguage = yield* Effect.forEach(
    extraLanguages,
    (language) =>
      translatePrompts(
        organizationId,
        language,
        prompts.slice(0, GEO_LANGUAGE_MAX_PROMPTS)
      )
        .pipe(
          geoSkip(`skipping language ${language}`, {
            event: "geo.check.failed",
            organizationId,
            projectId: settingsRow.projectId,
            scanId,
            language,
            grounded: false,
          })
        )
        .pipe(
          Effect.map((localized) =>
            localized ? { language, localized } : null
          )
        ),
    { concurrency: GEO_SCAN_CONCURRENCY }
  );
  for (const entry of localizedByLanguage) {
    if (!entry) {
      continue;
    }
    const { language, localized } = entry;
    for (const { engine, zdr } of trackedEngines) {
      for (const prompt of localized) {
        tasks.push({ engine, grounded: null, prompt, language, zdr });
      }
    }
    const localizedGrounded = localized.slice(
      0,
      GEO_LANGUAGE_GROUNDED_MAX_PROMPTS
    );
    for (const { grounded, zdr } of groundedEngines) {
      for (const prompt of localizedGrounded) {
        tasks.push({ engine: grounded.key, grounded, prompt, language, zdr });
      }
    }
  }

  const engines = [
    ...trackedEngines.map((entry) => entry.engine),
    ...groundedEngines.map((entry) => entry.grounded.key),
  ];
  yield* geoLogInfo({
    event: "geo.scan.started",
    organizationId,
    projectId: settingsRow.projectId,
    scanId,
    runId,
    engines,
    promptCount: prompts.length,
    languages: settings.languages,
    tasks: tasks.length,
  });

  const results = yield* Effect.forEach(
    tasks,
    (task) => {
      const fields = checkFailureFields(context, task);
      return runGeoCheck(context, task).pipe(
        Effect.catchTag("GeoEmptyAnswerError", (error) =>
          Effect.sync(() => droppedCheckOutcome(fields, error))
        ),
        geoSkip("check failed", fields)
      );
    },
    { concurrency: GEO_SCAN_CONCURRENCY }
  );
  const persistedRows = results.map((result) => result?.row ?? null);

  for (const summary of summarizeGeoEngineAttempts(tasks, persistedRows)) {
    if (summary.attempted === 0 || summary.failed < summary.attempted) {
      continue;
    }
    yield* geoLogError({
      event: "geo.scan.engine_dropped",
      organizationId,
      projectId: settingsRow.projectId,
      scanId,
      engine: summary.engine,
      attempted: summary.attempted,
      failed: summary.failed,
    });
  }

  const checkOutcomes = results.filter(
    (result): result is GeoCheckOutcome => result !== null
  );
  const rows: GeoCheckWrite[] = persistedRows.filter(
    (row): row is GeoCheckWrite => row !== null
  );
  let droppedChecks = tasks.length - rows.length;
  let usage = checkOutcomes.reduce(
    (total, outcome) => addTokenUsage(total, outcome.usage),
    EMPTY_TOKEN_USAGE
  );

  const sequenceRows = yield* Effect.tryPromise({
    try: () =>
      db.query.geoPromptSequences.findMany({
        columns: { id: true, steps: true },
        where: and(
          eq(geoPromptSequences.projectId, settingsRow.projectId),
          eq(geoPromptSequences.enabled, true)
        ),
        orderBy: [asc(geoPromptSequences.createdAt)],
        limit: GEO_MAX_SEQUENCES,
      }),
    catch: (cause) =>
      new GeoScanError({ message: "Failed to load GEO sequences", cause }),
  });

  const sequencePairs = scanEnglish
    ? sequenceRows.flatMap((sequence) =>
        groundedEngines.map(({ grounded, zdr }) => ({
          sequence,
          grounded,
          zdr,
        }))
      )
    : [];
  const sequenceResults = yield* Effect.forEach(
    sequencePairs,
    (pair) =>
      runGeoSequenceCheck(context, pair.sequence, pair.grounded, pair.zdr).pipe(
        geoSkip(
          "sequence failed",
          sequenceFailureFields(context, pair.sequence, pair.grounded)
        ),
        Effect.map((result) => ({ sequence: pair.sequence, result }))
      ),
    { concurrency: GEO_SCAN_CONCURRENCY }
  );
  for (const { sequence, result } of sequenceResults) {
    if (!result) {
      droppedChecks += sequenceTurnCount(sequence);
      continue;
    }
    droppedChecks += result.droppedTurns;
    rows.push(...result.rows);
    usage = addTokenUsage(usage, result.usage);
  }

  yield* Effect.tryPromise({
    try: () => insertGeoMentionChecks(rows),
    catch: (cause) =>
      new GeoScanError({ message: "Failed to store GEO checks", cause }),
  });

  const mentions = rows.filter((row) => row.mentioned).length;
  yield* geoLogInfo({
    event: "geo.scan.finished",
    status: "completed",
    organizationId,
    projectId: settingsRow.projectId,
    scanId,
    runId,
    engines,
    promptCount: prompts.length,
    checks: rows.length,
    mentions,
    droppedChecks,
    durationMs: Date.now() - startedAt,
  });

  const outcome: GeoProjectScanOutcome = {
    checks: rows.length,
    mentions,
    usage,
  };
  return outcome;
});

function addTokenUsage(
  total: AgentTokenUsage,
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  }
): AgentTokenUsage {
  return {
    inputTokens: total.inputTokens + (usage.inputTokens ?? 0),
    outputTokens: total.outputTokens + (usage.outputTokens ?? 0),
    totalTokens: total.totalTokens + (usage.totalTokens ?? 0),
    cacheReadTokens: total.cacheReadTokens,
    cacheWriteTokens: total.cacheWriteTokens,
  };
}

const EMPTY_TOKEN_USAGE: AgentTokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

function logGeoBillingFailure(
  action: "release" | "confirm",
  projectId: string,
  runId: string,
  error: unknown
): void {
  geoLog.error({
    event: "geo.scan.billing_failed",
    action,
    projectId,
    runId,
    ...describeGeoError(error),
  });
}

const runGeoSequenceCheck = Effect.fn("geo.runSequenceCheck")(function* (
  context: GeoCheckContext,
  sequence: GeoSequenceDefinition,
  grounded: GeoGroundedEngine,
  zdr: GeoZdrMode
) {
  const rows: GeoCheckWrite[] = [];
  const messages: ModelMessage[] = [];
  const steps = sequence.steps.slice(0, GEO_SEQUENCE_MAX_TURNS);
  const failureFields = sequenceFailureFields(context, sequence, grounded);
  let usage = EMPTY_TOKEN_USAGE;
  let droppedTurns = 0;

  for (const [index, step] of steps.entries()) {
    messages.push({ role: "user", content: step });
    const answer = yield* askGroundedConversation(
      context.organizationId,
      grounded,
      messages,
      zdr
    );
    usage = addTokenUsage(usage, answer.usage);
    const answerText = yield* requireAnswerText(
      grounded.key,
      sequencePromptId(sequence.id),
      DEFAULT_LANGUAGE,
      answer
    ).pipe(
      Effect.catchTag("GeoEmptyAnswerError", (error) =>
        Effect.sync(() => {
          logGeoSkip(
            "sequence turn failed",
            { ...failureFields, turn: index + 1 },
            error
          );
          return null;
        })
      )
    );
    if (answerText === null) {
      droppedTurns = steps.length - index;
      break;
    }
    messages.push({ role: "assistant", content: answerText });
    const judged = yield* judgeAnswer(context, step, answerText);

    rows.push({
      organizationId: context.organizationId,
      projectId: context.projectId,
      scanId: context.scanId,
      engine: grounded.key,
      promptId: sequencePromptId(sequence.id),
      sequenceId: sequence.id,
      turn: index + 1,
      prompt: step,
      answer: answerText,
      capturedAt: context.capturedAt,
      mentioned: judged.mentioned,
      position: normalizePosition(judged.position),
      sentiment: judged.sentiment,
      competitors: judged.competitors.slice(0, MAX_JUDGE_COMPETITORS),
      excerpt: judged.excerpt.slice(0, GEO_EXCERPT_MAX_LENGTH),
      grounding: answer.grounding,
      language: DEFAULT_LANGUAGE,
      sources: answer.sources,
    });
  }

  const outcome: GeoSequenceCheckOutcome = { rows, usage, droppedTurns };
  return outcome;
});

const runGeoScanProgram = Effect.fn("geo.runScan")(function* (
  organizationId: string,
  projectId?: string,
  claimedAt?: Date,
  scanId?: string
) {
  const billing = yield* GeoContentBillingService;
  const settingsRows = yield* Effect.tryPromise({
    try: () =>
      db.query.geoSettings.findMany({
        where: projectId
          ? and(
              eq(geoSettings.organizationId, organizationId),
              eq(geoSettings.projectId, projectId)
            )
          : eq(geoSettings.organizationId, organizationId),
        orderBy: [asc(geoSettings.createdAt)],
      }),
    catch: (cause) =>
      new GeoScanError({ message: "Failed to load GEO settings", cause }),
  });

  const enabledRows = settingsRows.filter((row) => row.enabled);

  // A scan may have been stamped as started (e.g. by a manual trigger) before
  // tracking was disabled; release that stamp so the UI doesn't show a
  // phantom "scanning" state until it goes stale. Release rather than stamp
  // finished: no scan ran, so `last_scan_at` must not move. For the project
  // this trigger claimed, compare-and-set on the original in-memory token —
  // a stamp read back from the database can shift under non-UTC runtimes
  // (`timestamp without time zone` readback) and would then never match.
  // For unclaimed rows the read-back stamp is the only handle we have; a
  // precision/timezone mismatch there degrades to "stays until stale", never
  // to freeing someone else's claim.
  for (const row of settingsRows) {
    if (row.enabled || !isGeoScanRunning(row.scanStartedAt, row.lastScanAt)) {
      continue;
    }
    const releaseToken =
      row.projectId === projectId && claimedAt
        ? claimedAt
        : (row.scanStartedAt ?? undefined);
    yield* releaseGeoScanRun(row.projectId, releaseToken).pipe(
      geoSkip("scan claim release failed")
    );
  }

  if (enabledRows.length === 0) {
    yield* geoLogWarn({
      event: "geo.scan.skipped",
      reason: "disabled",
      organizationId,
      projectId: projectId ?? null,
    });
    const skipped: GeoScanResult = { status: "skipped" };
    return skipped;
  }

  let checks = 0;
  let mentions = 0;
  for (const settingsRow of enabledRows) {
    // The trigger's claim token only covers the project it claimed. Every
    // other row an organization-wide sweep visits claims its own slot here;
    // losing that claim means another scan already owns the project, and
    // running anyway would bill the organization twice for the same work.
    // (A workflow queued before claim tokens existed lands here too: its
    // trigger blind-stamped the row, so the claim loses and the project
    // self-heals once that stamp goes stale — safer than stamping over a
    // fresh claim.)
    let rowClaimedAt =
      settingsRow.projectId === projectId ? claimedAt : undefined;
    if (!rowClaimedAt) {
      const claim = yield* claimGeoScanRun(settingsRow.projectId).pipe(
        geoSkip("scan claim failed")
      );
      if (!claim) {
        yield* Effect.logWarning(
          `geo: skipping scan for project ${settingsRow.projectId}: another scan already holds the slot`
        );
        continue;
      }
      rowClaimedAt = claim.claimedAt;
    }
    const runId = `geo-scan-${settingsRow.projectId}-${crypto.randomUUID()}`;
    const gate = yield* billing
      .gateContentBilling({
        organizationId: settingsRow.organizationId,
        executionId: runId,
        outputType: null,
        quotaFeatureId: FEATURES.AI_ANSWERS,
      })
      .pipe(
        Effect.mapError(
          (cause) =>
            new GeoScanError({ message: "Failed to reserve AI answers", cause })
        ),
        // A thrown billing gate aborts the whole program; the outer runGeoScan
        // finalizer only covers the trigger's own token, so a slot this loop
        // claimed for a swept project has to be handed back here.
        Effect.tapError(() =>
          releaseGeoScanRun(settingsRow.projectId, rowClaimedAt).pipe(
            geoSkip("scan claim release failed")
          )
        )
      );
    if (!gate.allowed) {
      yield* geoLogWarn({
        event: "geo.scan.skipped",
        reason: "billing",
        organizationId: settingsRow.organizationId,
        projectId: settingsRow.projectId,
        runId,
        detail: describeContentBillingDenial(gate),
      });
      // The slot was claimed above, and no scan is going to run — release it
      // rather than leaving the project stuck on "scanning" until the claim
      // goes stale. The release is compare-and-set on the token, so it cannot
      // free a claim that a later trigger took.
      yield* releaseGeoScanRun(settingsRow.projectId, rowClaimedAt).pipe(
        geoSkip("scan claim release failed")
      );
      continue;
    }

    const claim = yield* Ref.make(rowClaimedAt);
    const claimLock = yield* Semaphore.make(1);
    const finishStatusStamp = claimLock.withPermit(
      Ref.get(claim).pipe(
        Effect.flatMap((token) =>
          markGeoScanFinished(settingsRow.projectId, token)
        ),
        geoSkip("scan finish stamp failed")
      )
    );
    const tracked = withGeoScanRun(
      {
        organizationId: settingsRow.organizationId,
        projectId: settingsRow.projectId,
      },
      (rowScanId) => runGeoScanForProject(settingsRow, rowScanId, runId),
      {
        claimedAt: rowClaimedAt,
        finishStatusStamp,
        // The pre-created row belongs to the project the trigger claimed.
        // Every other row an organization-wide sweep visits gets its own.
        scanId: settingsRow.projectId === projectId ? scanId : undefined,
      }
    );
    const result = yield* Effect.raceFirst(
      tracked,
      maintainGeoScanClaim(settingsRow.projectId, claim, claimLock)
    ).pipe(
      Effect.tapError(() =>
        billing
          .finalizeContentBilling({
            reservation: gate,
            action: "release",
            logPrefix: "GeoScan",
          })
          .pipe(
            Effect.catch((releaseError) =>
              Effect.sync(() => {
                logGeoBillingFailure(
                  "release",
                  settingsRow.projectId,
                  runId,
                  releaseError
                );
              })
            )
          )
      )
    );

    yield* billing
      .finalizeContentBilling({
        reservation: gate,
        action: "confirm",
        units: result.checks,
        usage: result.usage,
        fallbackModelId: GEO_JUDGE_MODEL,
        properties: {
          source: "geo_scan",
          run_id: runId,
          project_id: settingsRow.projectId,
          markup_applied: gate.useMarkup,
        },
        logPrefix: "GeoScan",
      })
      .pipe(
        Effect.catch((confirmError) =>
          Effect.sync(() => {
            logGeoBillingFailure(
              "confirm",
              settingsRow.projectId,
              runId,
              confirmError
            );
          })
        )
      );

    checks += result.checks;
    mentions += result.mentions;
  }

  const completed: GeoScanResult = {
    status: "completed",
    checks,
    mentions,
  };
  return completed;
});

/**
 * Runs the scan the trigger handed off, ending the trigger's claim whatever
 * happens.
 *
 * The finalizer has to sit out here rather than inside `withGeoScanRun`: the
 * settings load and the billing gate both run *before* that wrapper exists, so
 * a database blip loading settings, or a throw from the billing gate, used to
 * escape with `scan_started_at` still stamped and pin the project on
 * "Scanning…" for `GEO_SCAN_STALE_MS`. Release rather than finish — a run that
 * failed before it started must not move `last_scan_at`.
 *
 * The release is compare-and-set on the claim token, so it is a no-op once the
 * run itself already ended the claim (`withGeoScanRun` clears
 * `scan_started_at` on exit) or once the claim went stale and someone else took
 * the slot.
 *
 * `scanId` is a `geo_scans` row the trigger already inserted and handed to its
 * caller to poll. It only ever matches the claimed project, and it gets the
 * same treatment as the claim: a second finalizer ends it whatever happens.
 * The stamp is guarded on `status = 'running'`, so it is a no-op once the run
 * wrote its own verdict and only fires on the paths that never reach
 * `withGeoScanRun` — settings vanished or got disabled, the claim was lost to a
 * scan already in flight, the billing gate refused. Those used to leave a row
 * the client polls stuck on "running" forever.
 */
export function runGeoScan(
  organizationId: string,
  projectId?: string,
  claimedAt?: Date,
  scanId?: string
) {
  if (projectId && claimedAt) {
    return Effect.gen(function* () {
      const renewed = yield* renewGeoScanRun(projectId, claimedAt);
      if (!renewed) {
        yield* Effect.logWarning(
          `geo: skipping delayed or duplicate scan for project ${projectId}: the claim is no longer current`
        );
        const skipped: GeoScanResult = { status: "skipped" };
        return skipped;
      }

      const guarded = runGeoScanProgram(
        organizationId,
        projectId,
        renewed.claimedAt,
        scanId
      ).pipe(
        Effect.onError(() =>
          releaseGeoScanRun(projectId, renewed.claimedAt).pipe(
            geoSkip("scan claim release failed")
          )
        )
      );
      if (!scanId) {
        return yield* guarded;
      }
      return yield* guarded.pipe(
        Effect.ensuring(
          failPendingGeoScanRow({ organizationId, projectId }, scanId).pipe(
            geoSkip("scan row fail stamp failed")
          )
        )
      );
    });
  }

  const program = runGeoScanProgram(organizationId, projectId);
  if (!(scanId && projectId)) {
    return program;
  }
  return program.pipe(
    Effect.ensuring(
      failPendingGeoScanRow({ organizationId, projectId }, scanId).pipe(
        geoSkip("scan row fail stamp failed")
      )
    )
  );
}

/**
 * Plays a single conversation against every available grounded engine right
 * away, outside the scheduled scan. The run is recorded as a regular
 * `geo_scans` row so its checks show up alongside scan results, and it is
 * charged against the organization's AI credits.
 */
const runGeoSequenceNowProgram = Effect.fn("geo.runSequenceNow")(function* (
  input: GeoScopeInput,
  sequenceId: string
) {
  const billing = yield* GeoContentBillingService;
  const scope = yield* requireGeoProject(input);
  const projectId = scope.projectId;

  const sequenceRow = yield* Effect.tryPromise({
    try: () =>
      db.query.geoPromptSequences.findFirst({
        columns: { id: true, steps: true },
        where: and(
          eq(geoPromptSequences.id, sequenceId),
          eq(geoPromptSequences.projectId, projectId)
        ),
      }),
    catch: (cause) =>
      new GeoSequenceRunError({
        message: "Failed to load the conversation",
        cause,
      }),
  });
  if (!sequenceRow) {
    return yield* Effect.fail(new GeoSequenceNotFoundError({ sequenceId }));
  }

  const settingsRow = yield* Effect.tryPromise({
    try: () =>
      db.query.geoSettings.findFirst({
        where: eq(geoSettings.projectId, projectId),
      }),
    catch: (cause) =>
      new GeoSequenceRunError({
        message: "Failed to load GEO settings",
        cause,
      }),
  });
  if (!settingsRow) {
    return yield* Effect.fail(
      new GeoSettingsMissingError({ organizationId: scope.organizationId })
    );
  }

  const catalog = yield* loadGeoModelCatalog(scope.organizationId);
  const settings = toGeoSettings(settingsRow, catalog);
  const zdrPolicy = {
    enforceZdr: settings.enforceZdr,
    nonZdrApprovedEngines: settings.nonZdrApprovedEngines,
  };

  const groundedEngines: { grounded: GeoGroundedEngine; zdr: GeoZdrMode }[] =
    [];
  for (const grounded of resolveGroundedEngines()) {
    const zdr = resolveGeoZdrMode(catalog, grounded.model, zdrPolicy);
    if (zdr === null) {
      yield* geoLogWarn({
        event: "geo.scan.skipped",
        reason: "zdr",
        organizationId: scope.organizationId,
        projectId,
        sequenceId,
        engine: grounded.key,
      });
      continue;
    }
    groundedEngines.push({ grounded, zdr });
  }
  if (groundedEngines.length === 0) {
    return yield* Effect.fail(new GeoSequenceRunUnavailableError({}));
  }

  const runId = `geo-sequence-${sequenceId}-${crypto.randomUUID()}`;
  const gate = yield* billing
    .gateContentBilling({
      organizationId: scope.organizationId,
      executionId: runId,
      outputType: null,
      quotaFeatureId: FEATURES.AI_ANSWERS,
    })
    .pipe(
      Effect.mapError(
        (cause) =>
          new GeoSequenceRunError({
            message: "Failed to reserve AI credits",
            cause,
          })
      )
    );
  if (!gate.allowed) {
    return yield* Effect.fail(
      new GeoWriterCreditsExhaustedError({
        message: describeContentBillingDenial(gate),
      })
    );
  }

  // A replay occupies the project's scan slot exactly like a scan does, so it
  // takes the same atomic claim instead of stamping "scanning" blindly. If a
  // scan already holds the slot the replay still runs — it is independently
  // billed and writes its own `geo_scans` row — but it must not touch the
  // stamps, because finishing them would hand that scan's claim away.
  const claim = yield* claimGeoScanRun(projectId).pipe(
    geoSkip("scan claim failed")
  );
  const play = withGeoScanRun(
    { organizationId: scope.organizationId, projectId },
    (scanId) =>
      Effect.gen(function* () {
        const context: GeoCheckContext = {
          organizationId: scope.organizationId,
          projectId,
          scanId,
          catalog,
          capturedAt: new Date(),
          companyName: settings.companyName,
          aliases: settings.aliases,
        };
        const outcomes = yield* Effect.forEach(
          groundedEngines,
          (pair) =>
            runGeoSequenceCheck(
              context,
              sequenceRow,
              pair.grounded,
              pair.zdr
            ).pipe(
              geoSkip(
                "sequence run failed",
                sequenceFailureFields(context, sequenceRow, pair.grounded)
              )
            ),
          { concurrency: GEO_SCAN_CONCURRENCY }
        );
        const succeeded = outcomes.filter(
          (outcome): outcome is GeoSequenceCheckOutcome => outcome !== null
        );
        const rows = succeeded.flatMap((outcome) => outcome.rows);
        const usage = succeeded.reduce(
          (total, outcome) => addTokenUsage(total, outcome.usage),
          EMPTY_TOKEN_USAGE
        );
        if (rows.length === 0) {
          return yield* Effect.fail(new GeoSequenceEmptyError({ usage }));
        }
        yield* Effect.tryPromise({
          try: () => insertGeoMentionChecks(rows),
          catch: (cause) =>
            new GeoSequenceRunError({
              message: "Failed to store the conversation results",
              cause,
            }),
        });
        return { rows, usage };
      }),
    claim ? { claimedAt: claim.claimedAt } : { skipStatusStamps: true as const }
  );

  const confirmBilling = (units: number, usage: AgentTokenUsage) =>
    billing
      .finalizeContentBilling({
        reservation: gate,
        action: "confirm",
        units,
        usage,
        fallbackModelId: groundedEngines[0]?.grounded.model ?? GEO_JUDGE_MODEL,
        properties: {
          source: "geo_sequence_run",
          run_id: runId,
          sequence_id: sequenceId,
          markup_applied: gate.useMarkup,
        },
        logPrefix: "GeoSequenceRun",
      })
      .pipe(
        Effect.catch((confirmError) =>
          Effect.sync(() => {
            logGeoBillingFailure("confirm", projectId, runId, confirmError);
          })
        )
      );

  const result = yield* play.pipe(
    Effect.tapError((error) =>
      error._tag === "GeoSequenceEmptyError"
        ? confirmBilling(0, error.usage)
        : billing
            .finalizeContentBilling({
              reservation: gate,
              action: "release",
              logPrefix: "GeoSequenceRun",
            })
            .pipe(
              Effect.catch((releaseError) =>
                Effect.sync(() => {
                  logGeoBillingFailure(
                    "release",
                    projectId,
                    runId,
                    releaseError
                  );
                })
              )
            )
    ),
    Effect.catchTag("GeoSequenceEmptyError", () =>
      Effect.fail(
        new GeoSequenceRunError({
          message: "Engines failed to answer this conversation. Try again.",
        })
      )
    )
  );

  yield* confirmBilling(result.rows.length, result.usage);

  const response: GeoSequenceRunResponse = {
    checks: result.rows.length,
    mentions: result.rows.filter((row) => row.mentioned).length,
    engines: groundedEngines.map((pair) => pair.grounded.key),
  };
  return response;
});

export function runGeoSequenceNow(input: GeoScopeInput, sequenceId: string) {
  return runGeoSequenceNowProgram(input, sequenceId).pipe(
    Effect.ensuring(flushGeoLogEffect)
  );
}
