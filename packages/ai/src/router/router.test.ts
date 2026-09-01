import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  ROUTER_METADATA_KEY,
  ROUTER_PROVIDER_OPTIONS_KEY,
} from "@notra/ai/constants/router";

import { createVercelAdapter } from "./adapters/vercel";
import {
  GatewayCreditBalanceError,
  GatewayNotConfiguredError,
  NoCompliantRouteError,
  UnsupportedModelError,
} from "./errors";
import { classifyUpstreamFailure } from "./lazy-model";
import {
  callOptions,
  createFakeAdapter,
  createTestRouter,
  httpError,
  readStreamParts,
} from "./test-helpers";

const PAID_ORG = "org_paid";
const FREE_ORG = "org_free";
const MODEL = "anthropic/claude-sonnet-4.6";
const HTTP_BAD_REQUEST = 400;
const HTTP_PAYMENT_REQUIRED = 402;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVICE_UNAVAILABLE = 503;
const CREDIT_TTL_MS = 30_000;
const BAD_REQUEST_PATTERN = /bad request/;
const UPSTREAM_FAILED_PATTERN = /upstream failed/;

const plans = { [PAID_ORG]: "paid", [FREE_ORG]: "free" } as const;

describe("Vercel adapter metadata", () => {
  test("uses generationId metadata and resolves documented generation info", async () => {
    const requestedUrls: string[] = [];
    const generationFetch: typeof fetch = (input) => {
      requestedUrls.push(String(input));
      return Promise.resolve(
        Response.json({
          data: {
            id: "gen_test",
            total_cost: 0.001,
            upstream_inference_cost: 0.001,
            usage: 0.001,
            created_at: "2026-08-17T00:00:00.000Z",
            model: MODEL,
            is_byok: false,
            provider_name: "anthropic",
            streamed: true,
            finish_reason: "stop",
            latency: 100,
            generation_time: 500,
            native_tokens_prompt: 10,
            native_tokens_completion: 20,
            native_tokens_reasoning: 0,
            native_tokens_cached: 0,
            native_tokens_cache_creation: 0,
            billable_web_search_calls: 0,
          },
        })
      );
    };
    const adapter = createVercelAdapter({
      apiKey: "test-key",
      baseURL: "https://gateway.test/v1/ai",
      fetch: generationFetch,
    });

    assert.deepEqual(
      adapter.extractRouteMetadata({ gateway: { generationId: "gen_test" } }),
      { generationId: "gen_test" }
    );
    assert.ok(adapter.lookupRouteMetadata);
    assert.deepEqual(await adapter.lookupRouteMetadata("gen_test"), {
      model: MODEL,
      upstreamProvider: "anthropic",
    });
    assert.equal(
      requestedUrls[0],
      "https://gateway.test/v1/generation?id=gen_test"
    );
  });
});

function metadataOf(result: { providerMetadata?: Record<string, unknown> }) {
  return result.providerMetadata?.[ROUTER_METADATA_KEY] as
    | Record<string, unknown>
    | undefined;
}

describe("resolveRoute", () => {
  test("paid organization → vercel, free organization → openrouter", async () => {
    const { router } = createTestRouter({ plans });
    const paid = await router.resolveRoute({
      modelId: MODEL,
      organizationId: PAID_ORG,
    });
    const free = await router.resolveRoute({
      modelId: MODEL,
      organizationId: FREE_ORG,
    });
    assert.equal(paid.gateway, "vercel");
    assert.equal(paid.plan, "paid");
    assert.equal(paid.reason, "paid");
    assert.equal(free.gateway, "openrouter");
    assert.equal(free.reason, "free");
    assert.equal(free.zdrEnforced, true);
  });

  test("resolves independent plan and ZDR lookups concurrently", async () => {
    let releasePlan: (() => void) | undefined;
    const planPending = new Promise<void>((resolve) => {
      releasePlan = resolve;
    });
    let zdrStarted = false;
    const { router } = createTestRouter({
      resolvePlan: async () => {
        await planPending;
        return "paid";
      },
      resolveZdr: () => {
        zdrStarted = true;
        return Promise.resolve("required");
      },
    });

    const routePending = router.resolveRoute({
      modelId: MODEL,
      organizationId: PAID_ORG,
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    assert.equal(zdrStarted, true);
    releasePlan?.();
    assert.equal((await routePending).gateway, "vercel");
  });

  test("missing organization context uses the default gateway", async () => {
    const { router, planLookups } = createTestRouter({ plans });
    const decision = await router.resolveRoute({ modelId: MODEL });
    assert.equal(decision.gateway, "openrouter");
    assert.equal(decision.reason, "no-org-default");
    assert.equal(decision.plan, undefined);
    assert.deepEqual(planLookups, []);
  });

  test("plan lookups are cached for the TTL", async () => {
    let now = 0;
    const { router, planLookups } = createTestRouter({
      plans,
      now: () => now,
      planCacheTtlMs: 1000,
    });
    await router.resolveRoute({ modelId: MODEL, organizationId: PAID_ORG });
    await router.resolveRoute({ modelId: MODEL, organizationId: PAID_ORG });
    assert.deepEqual(planLookups, [PAID_ORG]);
    now = 1001;
    const decision = await router.resolveRoute({
      modelId: MODEL,
      organizationId: PAID_ORG,
    });
    assert.deepEqual(planLookups, [PAID_ORG, PAID_ORG]);
    assert.equal(decision.planSource, "resolver");
  });

  test("plan lookup failure falls back to free and logs", async () => {
    const { router, logger } = createTestRouter({
      resolvePlan: () => Promise.reject(new Error("autumn down")),
    });
    const decision = await router.resolveRoute({
      modelId: MODEL,
      organizationId: PAID_ORG,
    });
    assert.equal(decision.plan, "free");
    assert.equal(decision.planSource, "default");
    assert.ok(
      logger.entries.some(
        (entry) => entry.event === "ai.router.plan_lookup_failed"
      )
    );
  });

  test("missing openrouter key: free org falls back to vercel with reason", async () => {
    const { router, logger } = createTestRouter({ plans, openrouter: null });
    const decision = await router.resolveRoute({
      modelId: MODEL,
      organizationId: FREE_ORG,
    });
    assert.equal(decision.gateway, "vercel");
    assert.equal(decision.reason, "fallback");
    assert.equal(decision.fallbackFrom, "openrouter");
    assert.equal(decision.fallbackReason, "not-configured");
    assert.ok(
      logger.entries.some((entry) => entry.event === "ai.router.fallback")
    );
  });

  test("disabled fallback surfaces an unavailable preferred gateway", async () => {
    const { router } = createTestRouter({
      plans,
      openrouter: null,
      policy: { crossGatewayFallback: false },
    });
    await assert.rejects(
      router.resolveRoute({ modelId: MODEL, organizationId: FREE_ORG }),
      GatewayNotConfiguredError
    );
  });

  test("no configured gateway at all fails with GatewayNotConfiguredError", async () => {
    const { router } = createTestRouter({ vercel: null, openrouter: null });
    await assert.rejects(
      router.resolveRoute({ modelId: MODEL, organizationId: FREE_ORG }),
      GatewayNotConfiguredError
    );
  });

  test("unsupported model on the preferred gateway falls back to the other", async () => {
    const openrouter = createFakeAdapter({
      id: "openrouter",
      supportedModels: (modelId) => modelId !== "vercel/only-model",
    });
    const { router } = createTestRouter({ plans, openrouter });
    const decision = await router.resolveRoute({
      modelId: "vercel/only-model",
      organizationId: FREE_ORG,
    });
    assert.equal(decision.gateway, "vercel");
    assert.equal(decision.fallbackReason, "unsupported-model");
  });

  test("model unsupported everywhere throws UnsupportedModelError", async () => {
    const vercel = createFakeAdapter({
      id: "vercel",
      supportedModels: () => false,
    });
    const openrouter = createFakeAdapter({
      id: "openrouter",
      supportedModels: () => false,
    });
    const { router } = createTestRouter({ plans, vercel, openrouter });
    await assert.rejects(
      router.resolveRoute({ modelId: "nope/model", organizationId: FREE_ORG }),
      UnsupportedModelError
    );
  });

  test("empty ZDR provider set fails closed", async () => {
    const vercel = createFakeAdapter({ id: "vercel", enforcesZdr: false });
    const openrouter = createFakeAdapter({
      id: "openrouter",
      enforcesZdr: false,
    });
    const { router, logger } = createTestRouter({ plans, vercel, openrouter });
    await assert.rejects(
      router.resolveRoute({ modelId: MODEL, organizationId: PAID_ORG }),
      NoCompliantRouteError
    );
    assert.ok(
      logger.entries.some(
        (entry) => entry.event === "ai.router.no_compliant_route"
      )
    );
  });

  test("non-compliant preferred gateway falls back to the compliant one", async () => {
    const openrouter = createFakeAdapter({
      id: "openrouter",
      enforcesZdr: false,
    });
    const { router } = createTestRouter({ plans, openrouter });
    const decision = await router.resolveRoute({
      modelId: MODEL,
      organizationId: FREE_ORG,
    });
    assert.equal(decision.gateway, "vercel");
    assert.equal(decision.fallbackReason, "non-compliant");
    assert.equal(decision.zdrEnforced, true);
  });

  test("development bypass allows a non-ZDR route and logs it", async () => {
    const openrouter = createFakeAdapter({
      id: "openrouter",
      enforcesZdr: false,
    });
    const { router, logger } = createTestRouter({
      plans,
      openrouter,
      policy: { allowNonZdr: true },
    });
    const decision = await router.resolveRoute({
      modelId: MODEL,
      organizationId: FREE_ORG,
    });
    assert.equal(decision.gateway, "openrouter");
    assert.equal(decision.zdrEnforced, false);
    assert.ok(
      logger.entries.some((entry) => entry.event === "ai.router.zdr_bypassed")
    );
  });

  test("pinned gateway is honoured and never falls back", async () => {
    const { router } = createTestRouter({ plans });
    const decision = await router.resolveRoute({
      modelId: MODEL,
      organizationId: FREE_ORG,
      gateway: "vercel",
    });
    assert.equal(decision.gateway, "vercel");
    assert.equal(decision.reason, "pinned");

    const { router: withoutVercel } = createTestRouter({ plans, vercel: null });
    await assert.rejects(
      withoutVercel.resolveRoute({ modelId: MODEL, gateway: "vercel" }),
      GatewayNotConfiguredError
    );
  });
});

describe("RoutedLanguageModel", () => {
  test("does not resolve until first call and memoises the route", async () => {
    const { router, openrouter, planLookups } = createTestRouter({ plans });
    const model = router.model(MODEL, { organizationId: FREE_ORG });
    assert.equal(model.provider, "notra-router");
    assert.equal(model.modelId, MODEL);
    assert.deepEqual(planLookups, []);

    await model.doGenerate(callOptions());
    await model.doGenerate(callOptions());
    assert.deepEqual(planLookups, [FREE_ORG]);
    assert.equal(openrouter?.calls.length, 2);
  });

  test("supportedUrls is lazy and resolves through the routed model", async () => {
    const { router, planLookups } = createTestRouter({ plans });
    const model = router.model(MODEL, { organizationId: FREE_ORG });
    const eager = model.supportedUrls;
    assert.deepEqual(planLookups, []);
    assert.deepEqual(await eager, {});
    assert.deepEqual(planLookups, [FREE_ORG]);
  });

  test("openrouter calls carry ZDR provider options and no vercel block", async () => {
    const { router, openrouter } = createTestRouter({ plans });
    const model = router.model(MODEL, { organizationId: FREE_ORG });
    await model.doGenerate(
      callOptions({
        gateway: { models: ["leak"] },
        [ROUTER_PROVIDER_OPTIONS_KEY]: {
          caching: "auto",
          fallbackModels: ["anthropic/claude-haiku-4.5"],
        },
        anthropic: {
          thinking: { type: "adaptive" },
          output_config: { effort: "high" },
        },
      })
    );
    const sent = openrouter?.calls[0]?.options.providerOptions ?? {};
    assert.equal("gateway" in sent, false);
    assert.equal(ROUTER_PROVIDER_OPTIONS_KEY in sent, false);
    const openrouterOptions = sent.openrouter as Record<string, unknown>;
    assert.deepEqual(openrouterOptions.provider, {
      zdr: true,
      data_collection: "deny",
    });
    assert.deepEqual(openrouterOptions.models, ["anthropic/claude-haiku-4.5"]);
    assert.deepEqual(openrouterOptions.reasoning, { effort: "high" });
    assert.ok(sent.anthropic, "vendor block passes through");
  });

  test("vercel calls carry zeroDataRetention/disallowPromptTraining and no openrouter block", async () => {
    const { router, vercel } = createTestRouter({ plans });
    const model = router.model(MODEL, { organizationId: PAID_ORG });
    await model.doGenerate(
      callOptions({
        openrouter: { provider: { zdr: false } },
        [ROUTER_PROVIDER_OPTIONS_KEY]: {
          caching: "auto",
          fallbackModels: ["anthropic/claude-haiku-4.5"],
        },
      })
    );
    const sent = vercel?.calls[0]?.options.providerOptions ?? {};
    assert.equal("openrouter" in sent, false);
    const gatewayOptions = sent.gateway as Record<string, unknown>;
    assert.equal(gatewayOptions.zeroDataRetention, true);
    assert.equal(gatewayOptions.disallowPromptTraining, true);
    assert.equal(gatewayOptions.caching, "auto");
    assert.deepEqual(gatewayOptions.models, ["anthropic/claude-haiku-4.5"]);
  });

  test("callers cannot downgrade privacy flags in production", async () => {
    const { router, vercel, openrouter } = createTestRouter({ plans });
    await router.model(MODEL, { organizationId: PAID_ORG }).doGenerate(
      callOptions({
        gateway: { zeroDataRetention: false, disallowPromptTraining: false },
      })
    );
    const vercelSent = vercel?.calls[0]?.options.providerOptions
      ?.gateway as Record<string, unknown>;
    assert.equal(vercelSent.zeroDataRetention, true);
    assert.equal(vercelSent.disallowPromptTraining, true);

    await router.model(MODEL, { organizationId: FREE_ORG }).doGenerate(
      callOptions({
        openrouter: { provider: { zdr: false, data_collection: "allow" } },
      })
    );
    const openrouterSent = openrouter?.calls[0]?.options.providerOptions
      ?.openrouter as Record<string, unknown>;
    assert.deepEqual(openrouterSent.provider, {
      zdr: true,
      data_collection: "deny",
    });
  });

  test("annotates generate results with route metadata", async () => {
    const { router } = createTestRouter({ plans });
    const result = await router
      .model(MODEL, { organizationId: FREE_ORG })
      .doGenerate(callOptions());
    const metadata = metadataOf(result);
    assert.equal(metadata?.gateway, "openrouter");
    assert.equal(metadata?.requestedModel, MODEL);
    assert.equal(metadata?.plan, "free");
    assert.equal(metadata?.upstreamProvider, "Amazon Bedrock");
    assert.equal(
      router.getRouteMetadata(result.providerMetadata)?.gateway,
      "openrouter"
    );
  });

  test("annotates the stream finish part with route metadata", async () => {
    const { router } = createTestRouter({ plans });
    const result = await router
      .model(MODEL, { organizationId: PAID_ORG })
      .doStream(callOptions());
    const parts = await readStreamParts(result);
    const finish = parts.find((part) => part.type === "finish");
    assert.ok(finish && finish.type === "finish");
    const metadata = finish.providerMetadata?.[ROUTER_METADATA_KEY] as
      | Record<string, unknown>
      | undefined;
    assert.equal(metadata?.gateway, "vercel");
    assert.equal(metadata?.generationId, "gen_test");
    assert.equal(metadata?.upstreamProvider, undefined);
  });

  test("enriches vercel metadata through the generation lookup API", async () => {
    const { router } = createTestRouter({ plans });
    const result = await router
      .model(MODEL, { organizationId: PAID_ORG })
      .doGenerate(callOptions());
    const metadata = router.getRouteMetadata(result.providerMetadata);
    assert.ok(metadata);
    const enriched = await router.enrichRouteMetadata(metadata);
    assert.equal(enriched.generationId, "gen_test");
    assert.equal(enriched.upstreamProvider, "anthropic");
  });

  test("upstream outage on openrouter falls back to vercel with ZDR preserved", async () => {
    let failures = 0;
    const openrouter = createFakeAdapter({
      id: "openrouter",
      onCall: () => {
        failures += 1;
        throw httpError(HTTP_SERVICE_UNAVAILABLE);
      },
    });
    const { router, vercel, logger } = createTestRouter({ plans, openrouter });
    const model = router.model(MODEL, { organizationId: FREE_ORG });
    const result = await model.doGenerate(callOptions());
    assert.equal(failures, 1);
    assert.equal(vercel?.calls.length, 1);
    const vercelSent = vercel?.calls[0]?.options.providerOptions
      ?.gateway as Record<string, unknown>;
    assert.equal(vercelSent.zeroDataRetention, true);
    const metadata = metadataOf(result);
    assert.equal(metadata?.gateway, "vercel");
    assert.equal(metadata?.fallbackFrom, "openrouter");
    assert.equal(metadata?.fallbackReason, "upstream-error");
    assert.equal(metadata?.plan, "free");
    assert.ok(
      logger.entries.some((entry) => entry.event === "ai.router.fallback")
    );

    // Subsequent calls stay on the fallback gateway.
    await model.doGenerate(callOptions());
    assert.equal(failures, 1);
    assert.equal(vercel?.calls.length, 2);
  });

  test("streams fall back when the upstream fails before the stream starts", async () => {
    const openrouter = createFakeAdapter({
      id: "openrouter",
      onCall: () => {
        throw httpError(HTTP_TOO_MANY_REQUESTS);
      },
    });
    const { router, vercel } = createTestRouter({ plans, openrouter });
    const result = await router
      .model(MODEL, { organizationId: FREE_ORG })
      .doStream(callOptions());
    const parts = await readStreamParts(result);
    assert.equal(vercel?.calls.length, 1);
    const finish = parts.find((part) => part.type === "finish");
    assert.ok(finish && finish.type === "finish");
    const metadata = finish.providerMetadata?.[ROUTER_METADATA_KEY] as
      | Record<string, unknown>
      | undefined;
    assert.equal(metadata?.fallbackFrom, "openrouter");
  });

  test("non-retryable errors surface without fallback", async () => {
    const openrouter = createFakeAdapter({
      id: "openrouter",
      onCall: () => {
        throw httpError(HTTP_BAD_REQUEST, "bad request");
      },
    });
    const { router, vercel } = createTestRouter({ plans, openrouter });
    await assert.rejects(async () => {
      await router
        .model(MODEL, { organizationId: FREE_ORG })
        .doGenerate(callOptions());
    }, BAD_REQUEST_PATTERN);
    assert.equal(vercel?.calls.length, 0);
  });

  test("no fallback when the other gateway is not ZDR compliant", async () => {
    const openrouter = createFakeAdapter({
      id: "openrouter",
      onCall: () => {
        throw httpError(HTTP_SERVICE_UNAVAILABLE);
      },
    });
    const vercel = createFakeAdapter({ id: "vercel", enforcesZdr: false });
    const { router, logger } = createTestRouter({ plans, openrouter, vercel });
    await assert.rejects(async () => {
      await router
        .model(MODEL, { organizationId: FREE_ORG })
        .doGenerate(callOptions());
    }, UPSTREAM_FAILED_PATTERN);
    assert.equal(vercel.calls.length, 0);
    assert.ok(
      logger.entries.some(
        (entry) => entry.event === "ai.router.no_compliant_route"
      )
    );
  });

  test("cross-gateway fallback can be disabled", async () => {
    const openrouter = createFakeAdapter({
      id: "openrouter",
      onCall: () => {
        throw httpError(HTTP_SERVICE_UNAVAILABLE);
      },
    });
    const { router, vercel } = createTestRouter({
      plans,
      openrouter,
      policy: { crossGatewayFallback: false },
    });
    await assert.rejects(async () => {
      await router
        .model(MODEL, { organizationId: FREE_ORG })
        .doGenerate(callOptions());
    });
    assert.equal(vercel?.calls.length, 0);
  });

  test("a 402 marks the gateway exhausted so later routes avoid it", async () => {
    const openrouter = createFakeAdapter({
      id: "openrouter",
      balance: 0,
      onCall: () => {
        throw httpError(HTTP_PAYMENT_REQUIRED, "insufficient credits");
      },
    });
    const { router, vercel } = createTestRouter({ plans, openrouter });
    await router
      .model(MODEL, { organizationId: FREE_ORG })
      .doGenerate(callOptions());
    assert.equal(vercel?.calls.length, 1);
    const next = await router.resolveRoute({
      modelId: MODEL,
      organizationId: FREE_ORG,
    });
    assert.equal(next.gateway, "vercel");
    assert.equal(next.fallbackReason, "no-credits");
  });

  test("a spurious 402 heals once the balance check reports credits", async () => {
    const openrouter = createFakeAdapter({
      id: "openrouter",
      onCall: () => {
        throw httpError(HTTP_PAYMENT_REQUIRED, "insufficient credits");
      },
    });
    const { router } = createTestRouter({ plans, openrouter });
    await router
      .model(MODEL, { organizationId: FREE_ORG })
      .doGenerate(callOptions());
    assert.equal(openrouter.balanceCalls, 1);
    const next = await router.resolveRoute({
      modelId: MODEL,
      organizationId: FREE_ORG,
    });
    assert.equal(next.gateway, "openrouter");
    assert.equal(next.fallbackReason, undefined);
  });
});

describe("development ZDR bypass", () => {
  test("omits ZDR flags unless the caller sets them, keeps no-training on", async () => {
    const { router, vercel, openrouter } = createTestRouter({
      plans,
      policy: { allowNonZdr: true },
    });
    await router
      .model(MODEL, { organizationId: PAID_ORG })
      .doGenerate(callOptions());
    const vercelSent = vercel?.calls[0]?.options.providerOptions
      ?.gateway as Record<string, unknown>;
    assert.equal("zeroDataRetention" in vercelSent, false);
    assert.equal(vercelSent.disallowPromptTraining, true);

    await router
      .model(MODEL, { organizationId: FREE_ORG })
      .doGenerate(callOptions({ openrouter: { provider: { zdr: true } } }));
    const openrouterSent = openrouter?.calls[0]?.options.providerOptions
      ?.openrouter as Record<string, unknown>;
    assert.deepEqual(openrouterSent.provider, {
      zdr: true,
      data_collection: "deny",
    });
  });
});

describe("ZDR rejection by a gateway", () => {
  test("a 403 ZDR error falls back to the compliant gateway and marks the route", async () => {
    const vercel = createFakeAdapter({
      id: "vercel",
      onCall: () => {
        throw httpError(
          HTTP_FORBIDDEN,
          "Zero Data Retention (ZDR) is only available for Pro and Enterprise plans."
        );
      },
    });
    const { router, openrouter, logger } = createTestRouter({ plans, vercel });
    const result = await router
      .model(MODEL, { organizationId: PAID_ORG })
      .doGenerate(callOptions());
    assert.equal(vercel.calls.length, 1);
    assert.equal(openrouter?.calls.length, 1);
    const metadata = metadataOf(result);
    assert.equal(metadata?.gateway, "openrouter");
    assert.equal(metadata?.fallbackReason, "non-compliant");
    assert.ok(
      logger.entries.some((entry) => entry.event === "ai.router.zdr_rejected")
    );

    // Later routes skip the non-compliant gateway without another roundtrip.
    const next = await router.resolveRoute({
      modelId: MODEL,
      organizationId: PAID_ORG,
    });
    assert.equal(next.gateway, "openrouter");
    assert.equal(next.fallbackReason, "non-compliant");

    // Pinned requests to the non-compliant gateway fail closed.
    await assert.rejects(
      router.resolveRoute({ modelId: MODEL, gateway: "vercel" }),
      NoCompliantRouteError
    );
  });
});

describe("zdr: preferred", () => {
  const ZDR_REJECTION =
    "Zero Data Retention (ZDR) is only available for Pro and Enterprise plans.";

  test("openrouter 'no endpoints matching your data policy' is a ZDR rejection", async () => {
    const openrouter = createFakeAdapter({
      id: "openrouter",
      onCall: (call) => {
        const block = call.options.providerOptions?.openrouter as
          | { provider?: Record<string, unknown> }
          | undefined;
        if (block?.provider?.zdr === true) {
          throw httpError(
            HTTP_NOT_FOUND,
            "No endpoints found matching your data policy (Zero data retention)."
          );
        }
      },
    });
    const { router, vercel } = createTestRouter({ plans, openrouter });
    const result = await router
      .model(MODEL, { organizationId: FREE_ORG, zdr: "preferred" })
      .doGenerate(callOptions());

    assert.equal(openrouter.calls.length, 1);
    assert.equal(vercel?.calls.length, 1);
    const metadata = metadataOf(result);
    assert.equal(metadata?.gateway, "vercel");
    assert.equal(metadata?.fallbackReason, "non-compliant");
    assert.equal(metadata?.zdrEnforced, true);
  });

  test("strict requests still fall back instead of relaxing", async () => {
    const vercel = createFakeAdapter({
      id: "vercel",
      onCall: () => {
        throw httpError(HTTP_FORBIDDEN, ZDR_REJECTION);
      },
    });
    const { router, openrouter } = createTestRouter({ plans, vercel });
    const result = await router
      .model(MODEL, { organizationId: PAID_ORG, zdr: "required" })
      .doGenerate(callOptions());
    assert.equal(vercel.calls.length, 1);
    assert.equal(openrouter?.calls.length, 1);
    assert.equal(metadataOf(result)?.gateway, "openrouter");
  });
});

describe("assertRouteHasCredits", () => {
  test("passes when the selected gateway has credits and caches the lookup", async () => {
    let now = 0;
    const openrouter = createFakeAdapter({ id: "openrouter", balance: 10 });
    const { router } = createTestRouter({
      plans,
      openrouter,
      now: () => now,
      creditCheckTtlMs: CREDIT_TTL_MS,
    });
    const first = await router.assertRouteHasCredits({
      modelId: MODEL,
      organizationId: FREE_ORG,
    });
    assert.equal(first.gateway, "openrouter");
    await router.assertRouteHasCredits({
      modelId: MODEL,
      organizationId: FREE_ORG,
    });
    assert.equal(openrouter.balanceCalls, 1);
    now = CREDIT_TTL_MS + 1;
    await router.assertRouteHasCredits({
      modelId: MODEL,
      organizationId: FREE_ORG,
    });
    assert.equal(openrouter.balanceCalls, 2);
  });

  test("exhausted openrouter credits fall back to vercel", async () => {
    const openrouter = createFakeAdapter({ id: "openrouter", balance: 0 });
    const { router } = createTestRouter({ plans, openrouter });
    const decision = await router.assertRouteHasCredits({
      modelId: MODEL,
      organizationId: FREE_ORG,
    });
    assert.equal(decision.gateway, "vercel");
    assert.equal(decision.fallbackReason, "no-credits");
    // Models created afterwards use the funded gateway as well.
    const model = router.model(MODEL, { organizationId: FREE_ORG });
    const result = await model.doGenerate(callOptions());
    assert.equal(metadataOf(result)?.gateway, "vercel");
  });

  test("throws GatewayCreditBalanceError when no funded route exists", async () => {
    const openrouter = createFakeAdapter({ id: "openrouter", balance: 0 });
    const vercel = createFakeAdapter({ id: "vercel", balance: -1 });
    const { router } = createTestRouter({ plans, openrouter, vercel });
    await assert.rejects(
      router.assertRouteHasCredits({
        modelId: MODEL,
        organizationId: FREE_ORG,
      }),
      GatewayCreditBalanceError
    );

    const { router: noFallback } = createTestRouter({
      plans,
      openrouter: createFakeAdapter({ id: "openrouter", balance: 0 }),
      policy: { crossGatewayFallback: false },
    });
    await assert.rejects(
      noFallback.assertRouteHasCredits({
        modelId: MODEL,
        organizationId: FREE_ORG,
      }),
      GatewayCreditBalanceError
    );
  });
});

describe("classifyUpstreamFailure", () => {
  test("maps status codes to fallback reasons", () => {
    assert.equal(
      classifyUpstreamFailure(httpError(HTTP_PAYMENT_REQUIRED)),
      "no-credits"
    );
    assert.equal(
      classifyUpstreamFailure(httpError(HTTP_NOT_FOUND)),
      "unsupported-model"
    );
    assert.equal(
      classifyUpstreamFailure(
        httpError(
          HTTP_NOT_FOUND,
          "No endpoints found matching your data policy"
        )
      ),
      "non-compliant"
    );
    assert.equal(
      classifyUpstreamFailure(httpError(HTTP_SERVICE_UNAVAILABLE)),
      "upstream-error"
    );
    assert.equal(
      classifyUpstreamFailure(httpError(HTTP_TOO_MANY_REQUESTS)),
      "upstream-error"
    );
    assert.equal(
      classifyUpstreamFailure(httpError(HTTP_BAD_REQUEST)),
      undefined
    );
    assert.equal(
      classifyUpstreamFailure(new TypeError("fetch failed")),
      "upstream-error"
    );
    const abort = new Error("aborted");
    abort.name = "AbortError";
    assert.equal(classifyUpstreamFailure(abort), undefined);
  });
});
