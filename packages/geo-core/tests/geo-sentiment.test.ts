import { afterAll, beforeAll, beforeEach, expect, mock, test } from "bun:test";
import assert from "node:assert/strict";

import { geoMentionChecks, geoScans } from "@notra/db/schema";
import { drizzle } from "drizzle-orm/pglite";
import { Effect } from "effect";

import { geoSentimentEvidenceInputSchema } from "../src/schemas/geo-sentiment";
import {
  sentimentPoints,
  summarizeSentiment,
} from "../src/utils/geo-sentiment";
import { createTestDatabase } from "./utils/database";

const { initializeDatabase, postgres, resetDatabase, seedProject, testDb } =
  createTestDatabase();

mock.module("@notra/db/drizzle", () => ({ db: testDb }));
const { queryGeoCheckSentiment, queryGeoCheckSentimentEvidence } =
  await import("@notra/db/utils/geo-checks");
const { loadGeoSentiment, loadGeoSentimentEvidence } =
  await import("../src/geo/sentiment");
const scope = { organizationId: "org-test", projectId: "main" };
const window = {
  from: new Date("2026-09-01T00:00:00Z"),
  toExclusive: new Date("2026-09-03T00:00:00Z"),
};

beforeAll(initializeDatabase, 30_000);
afterAll(() => postgres.close());
beforeEach(async () => {
  await resetDatabase();
  await seedProject("main");
  await testDb.insert(geoScans).values({ id: "scan", ...scope });
});

async function check(
  overrides: Partial<typeof geoMentionChecks.$inferInsert> = {}
) {
  const id = crypto.randomUUID();
  await testDb.insert(geoMentionChecks).values({
    id,
    ...scope,
    scanId: "scan",
    engine: "openai",
    promptId: id,
    prompt: "Describe our brand",
    answer: "Stored historical answer",
    mentioned: true,
    sentiment: "negative",
    capturedAt: window.from,
    ...overrides,
  });
}

test("exact labels, unknowns and non-mentions use the correct denominator", async () => {
  for (const sentiment of [
    "positive",
    "positive",
    "positive",
    "neutral",
    "neutral",
    "negative",
  ]) {
    await check({ sentiment });
  }
  expect(
    summarizeSentiment(await queryGeoCheckSentiment(scope, window))
  ).toMatchObject({ classifiedMentions: 6, positiveShare: 0.5 });
  for (let i = 0; i < 4; i++) {
    await check({ mentioned: false, sentiment: "positive" });
  }
  await check({ sentiment: null });
  await check({ sentiment: "unexpected" });
  expect(
    summarizeSentiment(await queryGeoCheckSentiment(scope, window))
  ).toMatchObject({
    totalChecks: 12,
    mentions: 8,
    positive: 3,
    neutral: 2,
    negative: 1,
    classifiedMentions: 6,
    unknownMentions: 2,
    notMentioned: 4,
    positiveShare: 0.5,
    classificationCoverage: 0.75,
  });
});

test("empty and unclassified buckets stay null; counts weight engines", async () => {
  expect(summarizeSentiment([]).positiveShare).toBeNull();
  await check({
    sentiment: null,
    capturedAt: new Date("2026-09-02T00:00:00Z"),
  });
  expect(
    summarizeSentiment(await queryGeoCheckSentiment(scope, window))
      .positiveShare
  ).toBeNull();
  for (let i = 0; i < 9; i++) {
    await check({ sentiment: "positive" });
  }
  await check({ sentiment: "neutral" });
  await check({ engine: "anthropic" });
  const rows = await queryGeoCheckSentiment(scope, window);
  expect(summarizeSentiment(rows).positiveShare).toBe(9 / 11);
  expect(
    summarizeSentiment(rows.filter((row) => row.day === "2026-09-02"))
      .positiveShare
  ).toBeNull();
  expect(rows.some((row) => row.day === "2026-09-03")).toBe(false);
});

test("scope, English, single-turn and inclusive/exclusive UTC boundaries apply to aggregates and evidence", async () => {
  await seedProject("other");
  await seedProject("foreign", { organizationId: "foreign-org" });
  await check({ projectId: "other" });
  await check({ projectId: "foreign", organizationId: "foreign-org" });
  await check({ language: "German" });
  await check({ sequenceId: "sequence" });
  await check({ capturedAt: new Date("2026-08-31T23:59:59.999Z") });
  await check({ capturedAt: window.toExclusive });
  await check({ id: "start", capturedAt: window.from });
  await check({ id: "end", capturedAt: new Date("2026-09-02T23:59:59.999Z") });
  const rows = await queryGeoCheckSentiment(scope, window);
  expect(summarizeSentiment(rows).totalChecks).toBe(2);
  expect(rows.map((row) => row.day)).toEqual(["2026-09-01", "2026-09-02"]);
  expect(
    (await queryGeoCheckSentimentEvidence(scope, window, 25)).map(
      (row) => row.id
    )
  ).toEqual(["end", "start"]);
});

test("keyset pagination preserves historical answers with tied timestamps", async () => {
  for (let i = 0; i < 51; i++) {
    await check({
      id: `negative-${String(i).padStart(2, "0")}`,
      promptId: `prompt-${i}`,
    });
  }
  await testDb.insert(geoScans).values({ id: "newer-scan", ...scope });
  await check({
    id: "newer-positive",
    scanId: "newer-scan",
    promptId: "prompt-0",
    engine: "openai",
    sentiment: "positive",
    capturedAt: new Date("2026-09-02T00:00:00Z"),
    answer: "New positive answer",
  });
  await check({ mentioned: false });
  const first = await queryGeoCheckSentimentEvidence(scope, window, 25);
  const last = first.at(-1);
  assert.ok(last);
  const second = await queryGeoCheckSentimentEvidence(scope, window, 25, {
    id: last.id,
    capturedAt: last.capturedAt.toISOString(),
  });
  const next = second.at(-1);
  assert.ok(next);
  const third = await queryGeoCheckSentimentEvidence(scope, window, 25, {
    id: next.id,
    capturedAt: next.capturedAt.toISOString(),
  });
  const items = [...first, ...second, ...third];
  expect([first.length, second.length, third.length]).toEqual([25, 25, 1]);
  expect(new Set(items.map((row) => row.id)).size).toBe(51);
  expect(items.find((row) => row.id === "negative-00")).toMatchObject({
    scanId: "scan",
    promptId: "prompt-0",
    engine: "openai",
    capturedAt: window.from,
    answer: "Stored historical answer",
  });
  expect(items.some((row) => row.id === "newer-positive")).toBe(false);
  expect(items.every((row) => row.answer === "Stored historical answer")).toBe(
    true
  );
});

test("cursor validation rejects malformed dates and changed scope", () => {
  const baseline = {
    ...scope,
    cursor: {
      id: "a",
      projectId: scope.projectId,
      capturedAt: window.from.toISOString(),
      scope: JSON.stringify([
        scope.organizationId,
        scope.projectId,
        null,
        null,
        null,
      ]),
    },
  };
  expect(geoSentimentEvidenceInputSchema.safeParse(baseline).success).toBe(
    true
  );
  const invalidDate = geoSentimentEvidenceInputSchema.safeParse({
    ...baseline,
    cursor: { ...baseline.cursor, capturedAt: "bad" },
  });
  assert.ok(!invalidDate.success);
  expect(invalidDate.error.issues.map((issue) => issue.path)).toEqual([
    ["cursor", "capturedAt"],
  ]);
  const mismatchedScope = geoSentimentEvidenceInputSchema.safeParse({
    ...baseline,
    cursor: { ...baseline.cursor, scope: "wrong" },
  });
  assert.ok(!mismatchedScope.success);
  expect(mismatchedScope.error.issues.map((issue) => issue.path)).toEqual([
    ["cursor"],
  ]);
});

test("missing calendar days are explicit null gaps", async () => {
  await check({ sentiment: "positive" });
  await check({ capturedAt: new Date("2026-09-03T00:00:00Z") });
  const points = sentimentPoints(
    await queryGeoCheckSentiment(scope, undefined)
  );
  expect(points.map((point) => point.positiveShare)).toEqual([1, null, 0]);
});

test("loaders resolve project scope, reject foreign projects and return valid scoped cursors", async () => {
  await seedProject("foreign", { organizationId: "foreign-org" });
  const range = { from: "2026-09-01", to: "2026-09-02" };
  for (let i = 0; i < 26; i++) {
    await check();
  }
  const response = await Effect.runPromise(loadGeoSentiment(scope, range));
  expect(response.summary.negative).toBe(26);
  expect(response.points[0]?.negative).toBe(26);
  expect(response.engines[0]?.negative).toBe(26);
  await expect(
    Effect.runPromise(
      loadGeoSentiment({ ...scope, projectId: "foreign" }, range)
    )
  ).rejects.toThrow();
  const page = await Effect.runPromise(
    loadGeoSentimentEvidence({ ...scope, ...range }, range)
  );
  expect(page.items).toHaveLength(25);
  assert.ok(page.nextCursor);
  const next = geoSentimentEvidenceInputSchema.parse({
    ...scope,
    ...range,
    cursor: page.nextCursor,
  });
  expect(
    (await Effect.runPromise(loadGeoSentimentEvidence(next, range))).items
  ).toHaveLength(1);
  expect(
    geoSentimentEvidenceInputSchema.safeParse({ ...next, projectId: "foreign" })
      .success
  ).toBe(false);
  expect(
    geoSentimentEvidenceInputSchema.safeParse({ ...next, from: "2026-08-01" })
      .success
  ).toBe(false);
});

test.skipIf(!process.env.GEO_SENTIMENT_BENCH)(
  "synthetic 30/90-day SQL query plans",
  async () => {
    await seedProject("other");
    await postgres.exec(`INSERT INTO geo_mention_checks
    (id, organization_id, project_id, scan_id, engine, prompt_id, prompt, answer, mentioned, sentiment, captured_at)
    SELECT 'bench-' || i, 'org-test', CASE WHEN i < 90000 THEN 'main' ELSE 'other' END,
      'scan', 'engine-' || (i % 5), 'bench-' || i, 'Synthetic prompt', 'Synthetic answer', true,
      CASE WHEN i % 3 = 0 THEN 'negative' WHEN i % 3 = 1 THEN 'neutral' ELSE 'positive' END,
      timestamp '2026-06-05' + ((i % 90000) / 1000) * interval '1 day'
    FROM generate_series(0, 179999) AS i;
    ANALYZE geo_mention_checks;`);
    let statement = "";
    let parameters: unknown[] = [];
    const measuredDb = drizzle(postgres, {
      logger: {
        logQuery(query, params) {
          statement = query;
          parameters = params;
        },
      },
    });
    mock.module("@notra/db/drizzle", () => ({ db: measuredDb }));
    try {
      for (const days of [30, 90]) {
        const toExclusive = new Date("2026-09-03T00:00:00Z");
        const from = new Date(toExclusive.getTime() - days * 86_400_000);
        const started = performance.now();
        const rows = await queryGeoCheckSentiment(scope, { from, toExclusive });
        const elapsedMs = performance.now() - started;
        expect(summarizeSentiment(rows).totalChecks).toBe(days * 1000);
        const plan = await postgres.query(
          `EXPLAIN (ANALYZE, BUFFERS) ${statement}`,
          parameters
        );
        console.log(
          JSON.stringify({
            days,
            checks: days * 1000,
            elapsedMs,
            plan: plan.rows,
          })
        );
      }
    } finally {
      mock.module("@notra/db/drizzle", () => ({ db: testDb }));
    }
  },
  30_000
);
