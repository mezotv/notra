import { gateway } from "@notra/ai/gateway";
import { ingestGeoMentionChecks } from "@notra/analytics/tinybird/client";
import type { GeoMentionCheckRow } from "@notra/analytics/tinybird/datasources";
import { toClickHouseDateTime } from "@notra/analytics/utils/datetime";
import { db } from "@notra/db/drizzle";
import { brandSettings, geoPrompts, geoSettings } from "@notra/db/schema";
import { generateText, Output, stepCountIs } from "ai";
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
  GEO_MAX_PROMPTS,
  GEO_SCAN_CONCURRENCY,
} from "@/constants/geo";
import {
  buildGroundedInvocation,
  resolveGroundedEngines,
} from "@/lib/geo/engines";
import { GeoScanError } from "@/lib/geo/errors";
import { captureModelUsageShare } from "@/lib/geo/model-usage";
import { buildGeoPrompts } from "@/lib/geo/prompts";
import { geoJudgeResultSchema } from "@/schemas/geo";
import type {
  GeoGroundedEngine,
  GeoJudgeResult,
  GeoPromptDefinition,
  GeoScanResult,
  GeoSettings,
} from "@/types/geo";

const MAX_JUDGE_COMPETITORS = 10;
const GROUNDED_MAX_STEPS = 4;

interface GeoCheckTask {
  engine: string;
  grounded: GeoGroundedEngine | null;
  prompt: GeoPromptDefinition;
}

interface GeoCheckContext {
  organizationId: string;
  scanId: string;
  capturedAt: string;
  companyName: string;
  aliases: string[];
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
- excerpt: at most ${GEO_EXCERPT_MAX_LENGTH} characters of the answer around the mention, or the first 200 characters of the answer if the company is not mentioned.`;
}

const askEngine = Effect.fn("geo.askEngine")(function* (
  engine: string,
  promptText: string
) {
  const result = yield* Effect.tryPromise({
    try: () =>
      generateText({
        model: gateway(engine),
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

const askGroundedEngine = Effect.fn("geo.askGroundedEngine")(function* (
  engine: GeoGroundedEngine,
  promptText: string
) {
  const result = yield* Effect.tryPromise({
    try: () => {
      const invocation = buildGroundedInvocation(engine);
      return generateText({
        model: invocation.model,
        tools: invocation.tools,
        stopWhen: stepCountIs(GROUNDED_MAX_STEPS),
        prompt: promptText,
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
});

const judgeAnswer = Effect.fn("geo.judgeAnswer")(function* (
  context: GeoCheckContext,
  promptText: string,
  answer: string
) {
  const result = yield* Effect.tryPromise({
    try: () =>
      generateText({
        model: gateway(GEO_JUDGE_MODEL),
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

const runGeoCheck = Effect.fn("geo.runCheck")(function* (
  context: GeoCheckContext,
  task: GeoCheckTask
) {
  const answer = task.grounded
    ? yield* askGroundedEngine(task.grounded, task.prompt.text)
    : yield* askEngine(task.engine, task.prompt.text);
  const judged = yield* judgeAnswer(context, task.prompt.text, answer);

  const row: GeoMentionCheckRow = {
    organization_id: context.organizationId,
    scan_id: context.scanId,
    engine: task.engine,
    prompt_id: task.prompt.id,
    prompt: task.prompt.text,
    captured_at: context.capturedAt,
    mentioned: judged.mentioned,
    position: normalizePosition(judged.position),
    sentiment: judged.sentiment,
    competitors: judged.competitors.slice(0, MAX_JUDGE_COMPETITORS),
    excerpt: judged.excerpt.slice(0, GEO_EXCERPT_MAX_LENGTH),
  };

  return row;
});

export const runGeoScan = Effect.fn("geo.runScan")(function* (
  organizationId: string
) {
  const settingsRow = yield* Effect.tryPromise({
    try: () =>
      db.query.geoSettings.findFirst({
        where: eq(geoSettings.organizationId, organizationId),
      }),
    catch: (cause) =>
      new GeoScanError({ message: "Failed to load GEO settings", cause }),
  });

  if (!settingsRow?.enabled) {
    const skipped: GeoScanResult = { status: "skipped" };
    return skipped;
  }

  const settings: GeoSettings = {
    id: settingsRow.id,
    organizationId: settingsRow.organizationId,
    companyName: settingsRow.companyName,
    aliases: settingsRow.aliases,
    competitors: settingsRow.competitors,
    enabled: settingsRow.enabled,
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
          eq(geoPrompts.organizationId, organizationId),
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
      id: `custom-${row.id}`,
      text: row.prompt,
    })),
  ];

  const context: GeoCheckContext = {
    organizationId,
    scanId: crypto.randomUUID(),
    capturedAt: toClickHouseDateTime(new Date()),
    companyName: settings.companyName,
    aliases: settings.aliases,
  };

  const tasks: GeoCheckTask[] = [];
  for (const engine of GEO_ENGINES) {
    for (const prompt of prompts) {
      tasks.push({ engine, grounded: null, prompt });
    }
  }

  const groundedEngines = resolveGroundedEngines();
  const groundedPrompts = prompts.slice(0, GEO_GROUNDED_MAX_PROMPTS);
  for (const grounded of groundedEngines) {
    for (const prompt of groundedPrompts) {
      tasks.push({ engine: grounded.key, grounded, prompt });
    }
  }

  const results = yield* Effect.forEach(
    tasks,
    (task) =>
      runGeoCheck(context, task).pipe(
        Effect.catch((error: GeoScanError) => {
          console.error(
            `[GEO] check failed for ${task.engine}/${task.prompt.id}:`,
            error
          );
          return Effect.succeed(null);
        })
      ),
    { concurrency: GEO_SCAN_CONCURRENCY }
  );

  const rows: GeoMentionCheckRow[] = [];
  for (const result of results) {
    if (result) {
      rows.push(result);
    }
  }

  yield* Effect.tryPromise({
    try: () => ingestGeoMentionChecks(rows),
    catch: (cause) =>
      new GeoScanError({ message: "Failed to ingest GEO checks", cause }),
  });

  yield* captureModelUsageShare().pipe(
    Effect.catch((error: GeoScanError) => {
      console.error("[GEO] model usage snapshot failed:", error);
      return Effect.succeed(null);
    })
  );

  const completed: GeoScanResult = {
    status: "completed",
    checks: rows.length,
    mentions: rows.filter((row) => row.mentioned).length,
  };
  return completed;
});
