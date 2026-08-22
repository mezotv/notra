# Model router

Plan-aware routing between the Vercel AI Gateway and OpenRouter, exposed to
the rest of the monorepo through `@notra/ai/gateway`:

```ts
import { gateway, assertRouteHasCredits } from "@notra/ai/gateway";

await assertRouteHasCredits({ organizationId });
const model = gateway("anthropic/claude-sonnet-5", { organizationId });
// pin a gateway when you rely on gateway-specific features:
const grounded = gateway("openai/gpt-5.4", { organizationId, gateway: "vercel" });
```

`gateway()` stays synchronous. It returns a lazy `LanguageModelV3`
(`RoutedLanguageModel`) that resolves its route on the first
`doGenerate`/`doStream`, so it composes with `withSupermemory`,
`wrapLanguageModel`, evlog and devtools exactly like the old Vercel-only model.

## Policy

| situation                   | gateway                |
| --------------------------- | ---------------------- |
| pinned via `gateway` option | as pinned, no fallback |
| no organization context     | openrouter             |
| paid plan                   | vercel                 |
| free plan                   | openrouter             |

The plan is resolved once per organization through `resolvePlan`
(`@notra/ai/billing/plan` → Autumn) and cached for 60 s.
The policy is defined in `@notra/ai/constants/router` and applies to all
organizations immediately. Development omits ZDR flags unless a caller sets
one explicitly; other environments enforce ZDR.

## Privacy

Outside development, every request forces zero data retention and no training:

- OpenRouter: `provider: { zdr: true, data_collection: "deny" }` — set on the
  provider, on the model and on every call (`providerOptions.openrouter`).
- Vercel: `gateway: { zeroDataRetention: true, disallowPromptTraining: true }`.

If the preferred gateway cannot serve a compliant request (not configured,
model unsupported, credits exhausted, upstream outage, or the gateway rejects
the ZDR requirement — Vercel ZDR is Pro/Enterprise only) the router retries on
the other gateway **with the same privacy flags**. When no compliant route is
left it throws `NoCompliantRouteError` instead of downgrading.

Callers that may run without ZDR (e.g. GEO scans of a project that disabled
"Enforce ZDR", or a model the user explicitly approved without a ZDR host)
pass `zdr: "preferred"`:

```ts
gateway("meta/muse-spark-1.2", { organizationId, zdr: "preferred" });
```

The first attempt still carries the ZDR flags. Only when the gateway rejects
ZDR for that model (Vercel 403, OpenRouter 404 "no endpoints matching your
data policy") the same route is retried without the ZDR flag — no-training
stays on, the gateway is not marked unavailable for strict requests, and the
result is logged as `ai.router.zdr_bypassed` (`bypassReason: caller-preferred`)
with `zdrEnforced: false` in the route metadata.

## Gateway coverage

`isModelSupported()` (`router/model-ids.ts`) consults
`VERCEL_UNSUPPORTED_MODELS` / `OPENROUTER_UNSUPPORTED_MODELS`
(`@notra/ai/constants/router`). A model that only exists on OpenRouter goes
there directly (`fallbackReason: unsupported-model`) instead of burning a
request on Vercel first. Add OpenRouter-only ids (and an alias in
`OPENROUTER_MODEL_ALIASES` when the OpenRouter id differs) when you add them
to a catalog.

## Provider options

Call sites use `withRouterDefaults()` from `@notra/ai/provider-options`, which
writes a neutral `providerOptions.notraRouter` block (`caching`,
`fallbackModels`, `reasoning`). The router translates it per gateway and strips
the other gateway's block, so `gateway` options never reach OpenRouter and vice
versa. Vendor blocks (`anthropic`, `openai`) pass through; for OpenRouter the
Anthropic thinking / OpenAI reasoning settings are mapped to
`openrouter.reasoning`.

## Observability

- evlog events: `ai.router.route`, `ai.router.fallback`,
  `ai.router.fallback_unavailable`, `ai.router.no_compliant_route`,
  `ai.router.zdr_rejected`, `ai.router.zdr_bypassed`,
  `ai.router.plan_lookup_failed`, `ai.router.credits`,
  `ai.router.credits_check_failed`, `ai.router.generation_lookup_failed`.
- `providerMetadata.notraRouter` on every result / stream `finish` part:
  gateway, generation ID, requested + mapped model, plan, reason and fallback
  info. `summarizeRouteUsage(steps)` (`@notra/ai/utils/route-usage`) also
  resolves Vercel generation details to include the upstream provider and
  gateway-reported cost without blocking token streaming.

## Extraction

`packages/ai/src/router/**` has no `process.env` reads and no `@notra/*`
imports; everything is injected through `createModelRouter(config)`. The
Notra-specific glue (fixed policy, Autumn plan lookup, evlog logger, singleton)
lives in `packages/ai/src/constants/router.ts` and `packages/ai/src/gateway.ts`.

Live smoke test: `bun packages/ai/evals/router/live-check.ts` (uses the keys
from `.env`, fake plan resolver).
