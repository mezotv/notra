import "./utils/infrastructure";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";

import { geoMentionChecks, geoScans } from "@notra/db/schema";
import { Effect } from "effect";

import { GeoModelService, GeoFeatureFlagService } from "../src/deps";
import { GeoScanError } from "../src/geo/errors";
import {
  fakeModels,
  testBillingGate,
  testFeatureFlags,
} from "./constants/geo-boundaries";
import {
  initializeDatabase,
  resetDatabase,
  database,
  seedProject,
  testDb,
} from "./utils/database";
const { runGeoScanTaskBatch } = await import("../src/geo/scan");

beforeAll(initializeDatabase, 30_000);
afterAll(() => database.postgres.close());
beforeEach(resetDatabase);

describe("model service in real scan batches", () => {
  test("fake answer and judge persist the selected project and prompt", async () => {
    const scope = await seedProject("selected");
    await testDb.insert(geoScans).values({ id: "scan-test", ...scope });
    const result = await Effect.runPromise(
      runGeoScanTaskBatch(
        {
          ...scope,
          scanId: "scan-test",
          runId: "test-run",
          companyName: "Selected",
          aliases: [],
          gate: testBillingGate,
          startedAtMs: Date.now(),
        },
        [
          {
            engine: "openai/gpt-4o-mini",
            groundedKey: null,
            prompt: {
              id: "custom-selected",
              text: "Which tools should I choose?",
            },
            language: "English",
            zdr: "none",
          },
        ]
      ).pipe(
        Effect.provideService(GeoModelService, fakeModels),
        Effect.provideService(GeoFeatureFlagService, testFeatureFlags)
      )
    );
    expect(result.checks).toBe(1);
    expect(result.mentions).toBe(1);
    const [row] = await testDb.select().from(geoMentionChecks);
    expect(row?.projectId).toBe("selected");
    expect(row?.promptId).toBe("custom-selected");
    expect(row?.mentioned).toBe(true);
    expect(row?.answer).toBe("The selected brand is a good choice.");
  });

  test("typed provider refusal drops the check without a domain retry", async () => {
    const scope = await seedProject("selected");
    let attempts = 0;
    const result = await Effect.runPromise(
      runGeoScanTaskBatch(
        {
          ...scope,
          scanId: "scan-test",
          runId: "test-run",
          companyName: "Selected",
          aliases: [],
          gate: testBillingGate,
          startedAtMs: Date.now(),
        },
        [
          {
            engine: "openai/gpt-4o-mini",
            groundedKey: null,
            prompt: {
              id: "custom-selected",
              text: "Which tools should I choose?",
            },
            language: "English",
            zdr: "none",
          },
        ]
      ).pipe(
        Effect.provideService(GeoModelService, {
          ...fakeModels,
          answer: () => {
            attempts += 1;
            return Effect.fail(
              new GeoScanError({ message: "provider refused" })
            );
          },
        }),
        Effect.provideService(GeoFeatureFlagService, testFeatureFlags)
      )
    );
    expect(attempts).toBe(1);
    expect(result.dropped).toBe(1);
    expect(result.checks).toBe(0);
    expect(await testDb.select().from(geoMentionChecks)).toHaveLength(0);
  });
});
