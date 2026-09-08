import { describe, expect, test, mock } from "bun:test";
import assert from "node:assert/strict";

import {
  brandSettings,
  geoAgentReadinessReports,
  geoPromptSuggestions,
  geoPrompts,
  googleSearchConsoleIntegrations,
  geoMentionChecks,
  geoScans,
} from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { Deferred, Effect, Result } from "effect";

import {
  AgentReadinessNetwork,
  GeoWorkflowService,
  GeoModelService,
  GeoSearchConsoleService,
  GeoFeatureFlagService,
} from "../src/deps";
import {
  loadAgentReadiness,
  startAgentReadinessScan,
  executeAgentReadinessScan,
  makeAgentReadinessNetwork,
} from "../src/geo/agent-readiness";
import { GeoScanError } from "../src/geo/errors";
import {
  syncGscSuggestions,
  selectGscSiteAndSyncSuggestions,
} from "../src/geo/search-console";
import {
  acceptSuggestion,
  acceptAllSuggestions,
  dismissSuggestion,
  listSuggestions,
} from "../src/geo/suggestions";
import { AgentReadinessApiError } from "../src/schemas/agent-readiness-errors";
import { GeoModelError } from "../src/schemas/model-errors";
import { GeoSearchConsoleError } from "../src/schemas/search-console-errors";
import { seedGeoModelCatalog } from "../src/utils/geo-model-catalog";
import {
  fakeModels,
  readinessNetwork,
  testBillingGate,
  testFeatureFlags,
} from "./constants/geo-boundaries";
import { postgres, seedProject, testDb } from "./utils/database";
import {
  seedReadiness,
  seedSuggestion,
  seedGsc,
  withGscServices,
  withReadiness,
} from "./utils/geo-boundaries";

// The catalog feed is a separate network boundary; paid SDKs are never mocked.
mock.module("../src/geo/model-catalog", () => ({
  loadGeoModelCatalog: () => Effect.succeed(seedGeoModelCatalog()),
}));
mock.module("@notra/ai/agents/geo-opencode", () => ({
  askGeoOpenCode: () => {
    throw new Error("Unexpected OpenCode request");
  },
  askGeoOpenCodeConversation: () => {
    throw new Error("Unexpected OpenCode conversation");
  },
}));
const { runGeoScanTaskBatch } = await import("../src/geo/scan");

export function registerGeoBoundaryTests() {
  describe("Agent Readiness Effect boundaries", () => {
    test("stored remote report completes the owned row without another scan", async () => {
      const payload = await seedReadiness();
      const result = await Effect.runPromise(
        withReadiness(executeAgentReadinessScan(payload), {
          ...readinessNetwork,
          scan: () => Effect.die("Stored report must not start another scan"),
        })
      );
      expect(result).toEqual({ status: "completed" });
      const loaded = await Effect.runPromise(
        loadAgentReadiness({ ...payload, brandSettingsId: "brand-readiness" })
      );
      expect(loaded.report?.id).toBe(payload.reportId);
      expect(loaded.report?.score).toBe(80);
      expect(loaded.history).toHaveLength(1);
      expect(loaded.scan).toBeNull();
    });

    test("failed handoff plus failed stamping retains the original handoff", async () => {
      const scope = await seedProject("handoff-stamp");
      const cause = new Error("test rejected handoff");
      await postgres.exec(
        "ALTER TABLE geo_agent_readiness_reports ADD CONSTRAINT reject_handoff_failure CHECK (status <> 'failed') NOT VALID"
      );
      try {
        const result = await Effect.runPromise(
          startAgentReadinessScan({
            ...scope,
            brandSettingsId: "brand-handoff-stamp",
          }).pipe(
            Effect.provideService(GeoWorkflowService, {
              startGeoScanRun: () => Effect.die("unexpected"),
              startGeoWriterRun: () => Effect.die("unexpected"),
              startAgentReadinessRun: () => Effect.fail(cause),
            }),
            Effect.result
          )
        );
        assert.ok(Result.isFailure(result));
        assert.ok(result.failure._tag === "AgentReadinessStampError");
        expect(result.failure.cause).toHaveProperty("cause", cause);
        expect(result.failure.stampCause).toHaveProperty(
          "_tag",
          "GeoDatabaseError"
        );
      } finally {
        await postgres.exec(
          "ALTER TABLE geo_agent_readiness_reports DROP CONSTRAINT reject_handoff_failure"
        );
      }
    });

    test("report adapter classifies remote errors and malformed responses", async () => {
      for (const response of [
        new Response("unavailable", { status: 503 }),
        Response.json({ unexpected: true }),
      ]) {
        const result = await Effect.runPromise(
          Effect.gen(function* () {
            const network = yield* AgentReadinessNetwork;
            return yield* network.report("https://example.com");
          }).pipe(
            Effect.provide(makeAgentReadinessNetwork(async () => response)),
            Effect.result
          )
        );
        assert.ok(Result.isFailure(result));
        expect(result.failure._tag).toBe("AgentReadinessApiError");
      }
    });
    test("missing URL is an expected failure, not a defect", async () => {
      const scope = await seedProject("missing-url");
      await testDb
        .update(brandSettings)
        .set({ websiteUrl: "" })
        .where(eq(brandSettings.id, "brand-missing-url"));
      const result = await Effect.runPromise(
        loadAgentReadiness({
          ...scope,
          brandSettingsId: "brand-missing-url",
        }).pipe(Effect.result)
      );
      assert.ok(Result.isFailure(result));
      expect(result.failure._tag).toBe("AgentReadinessTargetMissingError");
    });

    test("database rejection stays in the typed error channel", async () => {
      await postgres.exec(
        'ALTER TABLE "brand_settings" RENAME TO "brand_settings_unavailable"'
      );
      try {
        const result = await Effect.runPromise(
          loadAgentReadiness({
            organizationId: "org-test",
            projectId: "missing",
            brandSettingsId: "missing",
          }).pipe(Effect.result)
        );
        assert.ok(Result.isFailure(result));
        expect(result.failure._tag).toBe("GeoDatabaseError");
      } finally {
        await postgres.exec(
          'ALTER TABLE "brand_settings_unavailable" RENAME TO "brand_settings"'
        );
      }
    });

    test("remote failure stamps a safe failed outcome", async () => {
      const payload = await seedReadiness();
      const result = await Effect.runPromise(
        withReadiness(executeAgentReadinessScan(payload), {
          ...readinessNetwork,
          report: () =>
            Effect.fail(
              new AgentReadinessApiError({ message: "Remote scan unavailable" })
            ),
        })
      );
      expect(result).toEqual({
        status: "failed",
        reason: "Remote scan unavailable",
      });
      expect(
        (await testDb.query.geoAgentReadinessReports.findFirst())?.status
      ).toBe("failed");
    });

    test("completion cannot overwrite a replacement scan", async () => {
      const payload = await seedReadiness();
      await testDb
        .update(geoAgentReadinessReports)
        .set({ status: "failed", errorMessage: "replaced" });
      await testDb.insert(geoAgentReadinessReports).values({
        id: "replacement",
        organizationId: payload.organizationId,
        projectId: payload.projectId,
        targetUrl: payload.targetUrl,
      });
      expect(
        await Effect.runPromise(
          withReadiness(executeAgentReadinessScan(payload))
        )
      ).toEqual({
        status: "failed",
        reason: "Scan was replaced before completion.",
      });
      expect(
        (
          await testDb.query.geoAgentReadinessReports.findFirst({
            where: eq(geoAgentReadinessReports.id, "replacement"),
          })
        )?.status
      ).toBe("running");
    });

    test("overlapping starts reuse the claimed report", async () => {
      const scope = await seedProject("claim");
      let starts = 0;
      const program = startAgentReadinessScan({
        ...scope,
        brandSettingsId: "brand-claim",
      }).pipe(
        Effect.provideService(GeoWorkflowService, {
          startGeoScanRun: () => Effect.die("unexpected"),
          startGeoWriterRun: () => Effect.die("unexpected"),
          startAgentReadinessRun: () =>
            Effect.sync(() => {
              starts += 1;
              return { runId: "ready" };
            }),
        })
      );
      const results = await Promise.all([
        Effect.runPromise(program),
        Effect.runPromise(program),
      ]);
      expect(starts).toBe(1);
      expect(results[0]?.reportId).toBe(results[1]?.reportId);
      expect(results.filter((result) => result.alreadyRunning)).toHaveLength(1);
    });

    test("failed handoff stamps the row and preserves its cause", async () => {
      const scope = await seedProject("handoff");
      const cause = new Error("test handoff refused");
      const program = startAgentReadinessScan({
        ...scope,
        brandSettingsId: "brand-handoff",
      }).pipe(
        Effect.provideService(GeoWorkflowService, {
          startGeoScanRun: () => Effect.die("unexpected"),
          startGeoWriterRun: () => Effect.die("unexpected"),
          startAgentReadinessRun: () => Effect.fail(cause),
        })
      );
      const result = await Effect.runPromise(program.pipe(Effect.result));
      assert.ok(Result.isFailure(result));
      assert.ok(result.failure._tag === "AgentReadinessStartError");
      expect(result.failure.cause).toBe(cause);
      expect(
        (await testDb.query.geoAgentReadinessReports.findFirst())?.status
      ).toBe("failed");
    });

    test("failure-stamp rejection retains both failures", async () => {
      const payload = await seedReadiness();
      await postgres.exec(
        "ALTER TABLE geo_agent_readiness_reports ADD CONSTRAINT reject_failure CHECK (status <> 'failed') NOT VALID"
      );
      const original = new AgentReadinessApiError({ message: "remote failed" });
      try {
        const result = await Effect.runPromise(
          withReadiness(executeAgentReadinessScan(payload), {
            ...readinessNetwork,
            report: () => Effect.fail(original),
          }).pipe(Effect.result)
        );
        assert.ok(Result.isFailure(result));
        expect(result.failure._tag).toBe("AgentReadinessStampError");
        expect(result.failure.cause).toBe(original);
        expect(result.failure.stampCause).toHaveProperty(
          "_tag",
          "GeoDatabaseError"
        );
      } finally {
        await postgres.exec(
          "ALTER TABLE geo_agent_readiness_reports DROP CONSTRAINT reject_failure"
        );
      }
    });

    test("SSE error cancels an incomplete stream and releases its reader", async () => {
      let cancelled = false;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"error"}\n\n')
          );
        },
        cancel() {
          cancelled = true;
        },
      });
      const layer = makeAgentReadinessNetwork(async () => new Response(stream));
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const network = yield* AgentReadinessNetwork;
          return yield* network.scan("https://example.com");
        }).pipe(Effect.provide(layer), Effect.result)
      );
      assert.ok(Result.isFailure(result));
      expect(result.failure._tag).toBe("AgentReadinessApiError");
      expect(cancelled).toBe(true);
      expect(stream.locked).toBe(false);
    });

    test("interruption forwards abort to the request and cleans up SSE", async () => {
      const entered = Deferred.makeUnsafe<void>();
      const cleaned = Deferred.makeUnsafe<void>();
      const signals: AbortSignal[] = [];
      const stream = new ReadableStream<Uint8Array>({
        cancel() {
          Effect.runSync(Deferred.succeed(cleaned, undefined));
        },
      });
      const layer = makeAgentReadinessNetwork(async (_url, init) => {
        if (init.signal) {
          signals.push(init.signal);
        }
        Effect.runSync(Deferred.succeed(entered, undefined));
        return new Response(stream);
      });
      const controller = new AbortController();
      const run = Effect.runPromise(
        Effect.gen(function* () {
          const network = yield* AgentReadinessNetwork;
          return yield* network.scan("https://example.com");
        }).pipe(Effect.provide(layer)),
        { signal: controller.signal }
      );
      await Effect.runPromise(Deferred.await(entered));
      controller.abort();
      await expect(run).rejects.toBeDefined();
      expect(signals[0]?.aborted).toBe(true);
      await Effect.runPromise(Deferred.await(cleaned));
      expect(stream.locked).toBe(false);
    });
  });

  describe("Search Console Effect sync", () => {
    test("site selection commits the chosen site only after successful generation", async () => {
      const integration = await seedGsc();
      const result = await Effect.runPromise(
        withGscServices(
          selectGscSiteAndSyncSuggestions(integration, "https://new.example")
        )
      );
      expect(result.status).toBe("completed");
      expect(
        (await testDb.query.googleSearchConsoleIntegrations.findFirst())
          ?.siteUrl
      ).toBe("https://new.example");
    });

    test("disconnecting and unselected integrations skip generation", async () => {
      await seedGsc();
      const models = {
        ...fakeModels,
        suggest: () => Effect.die("Skipped integrations must not generate"),
      };
      await testDb
        .update(googleSearchConsoleIntegrations)
        .set({ siteUrl: null });
      expect(
        await Effect.runPromise(
          withGscServices(syncGscSuggestions("org-test"), models)
        )
      ).toEqual({ status: "skipped", reason: "no_site_selected" });
      await testDb
        .update(googleSearchConsoleIntegrations)
        .set({ disconnectingAt: new Date() });
      expect(
        await Effect.runPromise(
          withGscServices(syncGscSuggestions("org-test"), models)
        )
      ).toEqual({ status: "skipped", reason: "integration_changed" });
    });

    test("empty keywords replace pending rows but preserve curated decisions", async () => {
      await seedGsc();
      await seedSuggestion("dismissed");
      await testDb
        .update(geoPromptSuggestions)
        .set({ status: "dismissed" })
        .where(eq(geoPromptSuggestions.id, "dismissed"));
      const result = await Effect.runPromise(
        syncGscSuggestions("org-test").pipe(
          Effect.provideService(GeoModelService, {
            ...fakeModels,
            suggest: () => Effect.die("No keywords must not generate"),
          }),
          Effect.provideService(GeoSearchConsoleService, {
            topQueries: () => Effect.succeed([]),
          })
        )
      );
      expect(result).toEqual({
        status: "completed",
        keywords: 0,
        suggestionsAdded: 0,
      });
      const rows = await testDb.select().from(geoPromptSuggestions);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.id).toBe("dismissed");
    });
    test("missing integration and reauth state skip without model calls", async () => {
      expect(
        await Effect.runPromise(withGscServices(syncGscSuggestions("absent")))
      ).toEqual({ status: "skipped", reason: "not_connected" });
      const integration = await seedGsc();
      expect(
        await Effect.runPromise(
          withGscServices(
            selectGscSiteAndSyncSuggestions(
              { ...integration, status: "reauth_required" },
              integration.siteUrl ?? ""
            )
          )
        )
      ).toEqual({ status: "skipped", reason: "reauth_required" });
    });

    test("success atomically replaces pending suggestions and stamps sync", async () => {
      await seedGsc();
      const outcome = await Effect.runPromise(
        withGscServices(syncGscSuggestions("org-test"))
      );
      expect(outcome).toEqual({
        status: "completed",
        keywords: 1,
        suggestionsAdded: 1,
      });
      const rows = await testDb.select().from(geoPromptSuggestions);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.prompt).toBe(
        "What are the best tools for sending email?"
      );
      expect(
        (await testDb.query.googleSearchConsoleIntegrations.findFirst())
          ?.lastSyncedAt
      ).not.toBeNull();
    });

    test("integration changed during generation cannot replace pending rows", async () => {
      await seedGsc();
      const outcome = await Effect.runPromise(
        withGscServices(syncGscSuggestions("org-test"), {
          ...fakeModels,
          suggest: (input) =>
            Effect.gen(function* () {
              yield* Effect.promise(() =>
                testDb
                  .update(googleSearchConsoleIntegrations)
                  .set({ siteUrl: "https://changed.example" })
              );
              return yield* fakeModels.suggest(input);
            }),
        })
      );
      expect(outcome).toEqual({
        status: "skipped",
        reason: "integration_changed",
      });
      expect((await testDb.query.geoPromptSuggestions.findFirst())?.id).toBe(
        "old-pending"
      );
    });

    test("generation failure preserves pending rows and stores curated copy", async () => {
      await seedGsc();
      const result = await Effect.runPromise(
        withGscServices(syncGscSuggestions("org-test"), {
          ...fakeModels,
          suggest: () =>
            Effect.fail(
              new GeoModelError({
                operation: "suggest",
                cause: new Error("private test diagnostic"),
              })
            ),
        }).pipe(Effect.result)
      );
      assert.ok(Result.isFailure(result));
      expect(result.failure._tag).toBe("GeoModelError");
      expect((await testDb.query.geoPromptSuggestions.findFirst())?.id).toBe(
        "old-pending"
      );
      expect(
        (await testDb.query.googleSearchConsoleIntegrations.findFirst())
          ?.lastError
      ).toBe(
        "We could not turn your Search Console keywords into prompt suggestions."
      );
    });

    test("Google reauth failure is typed and does not overwrite auth state", async () => {
      await seedGsc();
      const result = await Effect.runPromise(
        syncGscSuggestions("org-test").pipe(
          Effect.provideService(GeoModelService, fakeModels),
          Effect.provideService(GeoSearchConsoleService, {
            topQueries: () =>
              Effect.fail(
                new GeoSearchConsoleError({
                  reauthRequired: true,
                  cause: new Error("expired"),
                })
              ),
          }),
          Effect.result
        )
      );
      assert.ok(Result.isFailure(result));
      expect(result.failure._tag).toBe("GeoSearchConsoleError");
      expect(
        (await testDb.query.googleSearchConsoleIntegrations.findFirst())
          ?.lastError
      ).toBeNull();
    });

    test("transaction failure rolls back deletion and lastSyncedAt", async () => {
      await seedGsc();
      await postgres.exec(
        "ALTER TABLE geo_prompt_suggestions ADD CONSTRAINT reject_new CHECK (id = 'old-pending') NOT VALID"
      );
      try {
        const result = await Effect.runPromise(
          withGscServices(syncGscSuggestions("org-test")).pipe(Effect.result)
        );
        assert.ok(Result.isFailure(result));
        expect(result.failure._tag).toBe("GeoDatabaseError");
        expect((await testDb.query.geoPromptSuggestions.findFirst())?.id).toBe(
          "old-pending"
        );
        expect(
          (await testDb.query.googleSearchConsoleIntegrations.findFirst())
            ?.lastSyncedAt
        ).toBeNull();
      } finally {
        await postgres.exec(
          "ALTER TABLE geo_prompt_suggestions DROP CONSTRAINT reject_new"
        );
      }
    });
  });

  describe("suggestion transactions", () => {
    test("empty accept-all does not require or create a project", async () => {
      const result = await Effect.runPromise(
        acceptAllSuggestions({ organizationId: "absent" })
      );
      expect(result.accepted).toBe(0);
    });

    test("dismiss racing acceptance has exactly one pending-state winner", async () => {
      const scope = await seedProject("race");
      await seedSuggestion();
      const results = await Promise.all([
        Effect.runPromise(
          acceptSuggestion({ ...scope, suggestionId: "suggestion" }).pipe(
            Effect.result
          )
        ),
        Effect.runPromise(
          dismissSuggestion({ ...scope, suggestionId: "suggestion" }).pipe(
            Effect.result
          )
        ),
      ]);
      expect(
        results.filter((result) => result._tag === "Success")
      ).toHaveLength(1);
      expect(
        results.filter((result) => result._tag === "Failure")
      ).toHaveLength(1);
      const row = await testDb.query.geoPromptSuggestions.findFirst();
      const prompts = await testDb.select().from(geoPrompts);
      expect(prompts).toHaveLength(row?.status === "accepted" ? 1 : 0);
    });
    test("accept targets the selected project and reuses normalized duplicates", async () => {
      await seedProject("default");
      const scope = await seedProject("selected");
      await seedSuggestion();
      await testDb.insert(geoPrompts).values({
        id: "existing",
        ...scope,
        prompt: "  WHICH SUGGESTION TOOLS SHOULD I USE?  ",
      });
      const result = await Effect.runPromise(
        acceptSuggestion({ ...scope, suggestionId: "suggestion" })
      );
      expect(result.prompt.id).toBe("existing");
      expect(result.projectId).toBe("selected");
      expect(await testDb.select().from(geoPrompts)).toHaveLength(1);
      expect(
        (await testDb.query.geoPromptSuggestions.findFirst())?.acceptedPromptId
      ).toBe("existing");
    });

    test("foreign suggestions and foreign projects are refused", async () => {
      const scope = await seedProject("own");
      await seedProject("foreign", { organizationId: "other-org" });
      await seedSuggestion("foreign-suggestion", "other-org");
      const result = await Effect.runPromise(
        acceptSuggestion({ ...scope, suggestionId: "foreign-suggestion" }).pipe(
          Effect.result
        )
      );
      assert.ok(Result.isFailure(result));
      expect(result.failure._tag).toBe("GeoSuggestionNotFoundError");
      const foreignProject = await Effect.runPromise(
        acceptSuggestion({
          organizationId: scope.organizationId,
          projectId: "foreign",
          suggestionId: "foreign-suggestion",
        }).pipe(Effect.result)
      );
      assert.ok(Result.isFailure(foreignProject));
      expect(foreignProject.failure._tag).toBe("GeoProjectNotFoundError");
    });

    test("list, dismiss, and accept-all retain pending-only transitions", async () => {
      const scope = await seedProject("selected");
      await seedSuggestion("one");
      await seedSuggestion("two");
      await seedSuggestion("three");
      expect(
        (await Effect.runPromise(listSuggestions(scope))).suggestions
      ).toHaveLength(3);
      await Effect.runPromise(
        dismissSuggestion({ ...scope, suggestionId: "one" })
      );
      expect(
        (await Effect.runPromise(acceptAllSuggestions(scope))).accepted
      ).toBe(2);
      expect(
        (await Effect.runPromise(listSuggestions(scope))).suggestions
      ).toHaveLength(0);
      expect(
        (await Effect.runPromise(acceptAllSuggestions(scope))).accepted
      ).toBe(0);
      expect(await testDb.select().from(geoPrompts)).toHaveLength(2);
    });

    test("status write failure rolls back prompt insertion", async () => {
      const scope = await seedProject("selected");
      await seedSuggestion();
      await postgres.exec(
        "ALTER TABLE geo_prompt_suggestions ADD CONSTRAINT reject_accept CHECK (status <> 'accepted') NOT VALID"
      );
      try {
        const result = await Effect.runPromise(
          acceptSuggestion({ ...scope, suggestionId: "suggestion" }).pipe(
            Effect.result
          )
        );
        assert.ok(Result.isFailure(result));
        expect(result.failure._tag).toBe("GeoDatabaseError");
        expect(await testDb.select().from(geoPrompts)).toHaveLength(0);
        expect(
          (await testDb.query.geoPromptSuggestions.findFirst())?.status
        ).toBe("pending");
      } finally {
        await postgres.exec(
          "ALTER TABLE geo_prompt_suggestions DROP CONSTRAINT reject_accept"
        );
      }
    });

    test("concurrent acceptance has only one winner", async () => {
      const scope = await seedProject("selected");
      await seedSuggestion();
      const program = acceptSuggestion({
        ...scope,
        suggestionId: "suggestion",
      }).pipe(Effect.result);
      const results = await Promise.all([
        Effect.runPromise(program),
        Effect.runPromise(program),
      ]);
      expect(results.filter(Result.isSuccess)).toHaveLength(1);
      expect(results.filter(Result.isFailure)).toHaveLength(1);
      expect(await testDb.select().from(geoPrompts)).toHaveLength(1);
    });
  });

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

    test("typed provider refusal drops the check without retrying paid I/O", async () => {
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
}
