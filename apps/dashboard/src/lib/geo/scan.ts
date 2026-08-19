import { gateway } from "@notra/ai/gateway";
import { ingestGeoMentionChecks } from "@notra/analytics/tinybird/client";
import type { GeoMentionCheckRow } from "@notra/analytics/tinybird/datasources";
import { toClickHouseDateTime } from "@notra/analytics/utils/datetime";
import { db } from "@notra/db/drizzle";
import {
  brandSettings,
  geoPromptSequences,
  geoPrompts,
  geoSettings,
} from "@notra/db/schema";
import { generateText, type ModelMessage, Output, stepCountIs } from "ai";
import { and, asc, eq } from "drizzle-orm";
import { Effect } from "effect";
import {
  GEO_ANSWER_MAX_TOKENS,
  GEO_ANSWER_SYSTEM_PROMPT,
  GEO_ENGINES,
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
  GEO_SEQUENCE_MAX_TURNS,
  GEO_TRANSLATION_MAX_TOKENS,
} from "@/constants/geo";
import { geoSkip } from "@/lib/geo/effect";
import {
  buildGroundedInvocation,
  resolveGroundedEngines,
} from "@/lib/geo/engines";
import { GeoScanError } from "@/lib/geo/errors";
import { captureModelUsageShare } from "@/lib/geo/model-usage";
import { buildGeoPrompts, customPromptScanId } from "@/lib/geo/prompts";
import { markGeoScanFinished, withGeoScanStatus } from "@/lib/geo/scan-status";
import {
  geoJudgeResultSchema,
  geoTranslationResultSchema,
} from "@/schemas/geo";
import type {
  GeoCheckContext,
  GeoCheckTask,
  GeoGroundedEngine,
  GeoJudgeResult,
  GeoPromptDefinition,
  GeoScanResult,
  GeoSequenceDefinition,
  GeoSettings,
  GeoSettingsRow,
} from "@/types/geo";
import { isGeoScanRunning } from "@/utils/geo-scan";

const MAX_JUDGE_COMPETITORS = 10;
const GROUNDED_MAX_STEPS = 4;

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

const askEngine = Effect.fn("geo.askEngine")(function* (
  organizationId: string,
  engine: string,
  promptText: string
) {
  const result = yield* Effect.tryPromise({
    try: () =>
      generateText({
        model: gateway(engine, { organizationId }),
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
  return result.text;
});

const askGroundedConversation = Effect.fn("geo.askGroundedConversation")(
  function* (
    organizationId: string,
    engine: GeoGroundedEngine,
    messages: ModelMessage[]
  ) {
    const result = yield* Effect.tryPromise({
      try: () => {
        const invocation = buildGroundedInvocation(engine, { organizationId });
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
    return result.text;
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
      new GeoScanError({ message: "Judge model failed", cause }),
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
      new GeoScanError({
        message: `Translation to ${language} failed`,
        cause,
      }),
  });
  const translations = result.output.translations;
  if (translations.length !== prompts.length) {
    return yield* Effect.fail(
      new GeoScanError({
        message: `Translation to ${language} returned ${translations.length} prompts, expected ${prompts.length}`,
      })
    );
  }
  return prompts.map((prompt, index) => ({
    id: prompt.id,
    text: translations[index] ?? prompt.text,
  }));
});

const runGeoCheck = Effect.fn("geo.runCheck")(function* (
  context: GeoCheckContext,
  task: GeoCheckTask
) {
  const answer = task.grounded
    ? yield* askGroundedConversation(context.organizationId, task.grounded, [
        { role: "user", content: task.prompt.text },
      ])
    : yield* askEngine(context.organizationId, task.engine, task.prompt.text);
  const judged = yield* judgeAnswer(context, task.prompt.text, answer);

  const row: GeoMentionCheckRow = {
    organization_id: context.organizationId,
    project_id: context.projectId,
    scan_id: context.scanId,
    engine: task.engine,
    prompt_id: task.prompt.id,
    sequence_id: "",
    turn: 0,
    prompt: task.prompt.text,
    captured_at: context.capturedAt,
    mentioned: judged.mentioned,
    position: normalizePosition(judged.position),
    sentiment: judged.sentiment,
    competitors: judged.competitors.slice(0, MAX_JUDGE_COMPETITORS),
    excerpt: judged.excerpt.slice(0, GEO_EXCERPT_MAX_LENGTH),
    language: task.language,
  };

  return row;
});

const runGeoScanForProject = Effect.fn("geo.runScanProject")(function* (
  settingsRow: GeoSettingsRow
) {
  const organizationId = settingsRow.organizationId;

  const settings: GeoSettings = {
    id: settingsRow.id,
    organizationId: settingsRow.organizationId,
    projectId: settingsRow.projectId,
    companyName: settingsRow.companyName,
    aliases: settingsRow.aliases,
    competitors: settingsRow.competitors,
    languages: settingsRow.languages ?? [],
    enabled: settingsRow.enabled,
    scanStartedAt: settingsRow.scanStartedAt?.toISOString() ?? null,
    lastScanAt: settingsRow.lastScanAt?.toISOString() ?? null,
    isScanning: true,
    createdAt: settingsRow.createdAt.toISOString(),
    updatedAt: settingsRow.updatedAt.toISOString(),
  };

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
    scanId: crypto.randomUUID(),
    capturedAt: toClickHouseDateTime(new Date()),
    companyName: settings.companyName,
    aliases: settings.aliases,
  };

  const tasks: GeoCheckTask[] = [];
  for (const engine of GEO_ENGINES) {
    for (const prompt of prompts) {
      tasks.push({ engine, grounded: null, prompt, language: "English" });
    }
  }

  const groundedEngines = resolveGroundedEngines();
  const groundedPrompts = prompts.slice(0, GEO_GROUNDED_MAX_PROMPTS);
  for (const grounded of groundedEngines) {
    for (const prompt of groundedPrompts) {
      tasks.push({
        engine: grounded.key,
        grounded,
        prompt,
        language: "English",
      });
    }
  }

  const extraLanguages = settings.languages
    .filter((language) => language !== "English")
    .slice(0, GEO_MAX_LANGUAGES);
  const localizedByLanguage = yield* Effect.forEach(
    extraLanguages,
    (language) =>
      translatePrompts(
        organizationId,
        language,
        prompts.slice(0, GEO_LANGUAGE_MAX_PROMPTS)
      )
        .pipe(geoSkip(`skipping language ${language}`))
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
    for (const engine of GEO_ENGINES) {
      for (const prompt of localized) {
        tasks.push({ engine, grounded: null, prompt, language });
      }
    }
    const localizedGrounded = localized.slice(
      0,
      GEO_LANGUAGE_GROUNDED_MAX_PROMPTS
    );
    for (const grounded of groundedEngines) {
      for (const prompt of localizedGrounded) {
        tasks.push({ engine: grounded.key, grounded, prompt, language });
      }
    }
  }

  const results = yield* Effect.forEach(
    tasks,
    (task) =>
      runGeoCheck(context, task).pipe(
        geoSkip(`check failed for ${task.engine}/${task.prompt.id}`)
      ),
    { concurrency: GEO_SCAN_CONCURRENCY }
  );

  const rows: GeoMentionCheckRow[] = results.filter(
    (result): result is GeoMentionCheckRow => result !== null
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

  const sequencePairs = sequenceRows.flatMap((sequence) =>
    groundedEngines.map((grounded) => ({ sequence, grounded }))
  );
  const sequenceResults = yield* Effect.forEach(
    sequencePairs,
    (pair) =>
      runGeoSequenceCheck(context, pair.sequence, pair.grounded).pipe(
        geoSkip(`sequence failed for ${pair.grounded.key}/${pair.sequence.id}`)
      ),
    { concurrency: GEO_SCAN_CONCURRENCY }
  );
  rows.push(...sequenceResults.filter((result) => result !== null).flat());

  yield* Effect.tryPromise({
    try: () => ingestGeoMentionChecks(rows),
    catch: (cause) =>
      new GeoScanError({ message: "Failed to ingest GEO checks", cause }),
  });

  const completed: GeoScanResult = {
    status: "completed",
    checks: rows.length,
    mentions: rows.filter((row) => row.mentioned).length,
  };
  return completed;
});

const runGeoSequenceCheck = Effect.fn("geo.runSequenceCheck")(function* (
  context: GeoCheckContext,
  sequence: GeoSequenceDefinition,
  grounded: GeoGroundedEngine
) {
  const rows: GeoMentionCheckRow[] = [];
  const messages: ModelMessage[] = [];
  const steps = sequence.steps.slice(0, GEO_SEQUENCE_MAX_TURNS);

  for (const [index, step] of steps.entries()) {
    messages.push({ role: "user", content: step });
    const answer = yield* askGroundedConversation(
      context.organizationId,
      grounded,
      messages
    );
    messages.push({ role: "assistant", content: answer });
    const judged = yield* judgeAnswer(context, step, answer);

    rows.push({
      organization_id: context.organizationId,
      project_id: context.projectId,
      scan_id: context.scanId,
      engine: grounded.key,
      prompt_id: `sequence-${sequence.id}`,
      sequence_id: sequence.id,
      turn: index + 1,
      prompt: step,
      captured_at: context.capturedAt,
      mentioned: judged.mentioned,
      position: normalizePosition(judged.position),
      sentiment: judged.sentiment,
      competitors: judged.competitors.slice(0, MAX_JUDGE_COMPETITORS),
      excerpt: judged.excerpt.slice(0, GEO_EXCERPT_MAX_LENGTH),
      language: "English",
    });
  }

  return rows;
});

export const runGeoScan = Effect.fn("geo.runScan")(function* (
  organizationId: string,
  projectId?: string
) {
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
  // phantom "scanning" state until it goes stale.
  for (const row of settingsRows) {
    if (row.enabled || !isGeoScanRunning(row.scanStartedAt, row.lastScanAt)) {
      continue;
    }
    yield* markGeoScanFinished(row.projectId).pipe(
      geoSkip("scan finish stamp failed")
    );
  }

  if (enabledRows.length === 0) {
    const skipped: GeoScanResult = { status: "skipped" };
    return skipped;
  }

  let checks = 0;
  let mentions = 0;
  for (const settingsRow of enabledRows) {
    const result = yield* withGeoScanStatus(
      settingsRow.projectId,
      runGeoScanForProject(settingsRow)
    );
    checks += result.checks ?? 0;
    mentions += result.mentions ?? 0;
  }

  yield* captureModelUsageShare().pipe(geoSkip("model usage snapshot failed"));

  const completed: GeoScanResult = {
    status: "completed",
    checks,
    mentions,
  };
  return completed;
});
