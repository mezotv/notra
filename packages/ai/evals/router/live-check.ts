/**
 * Live smoke test for the model router. Talks to the real gateways with the
 * keys from the environment but uses a fake plan resolver so no billing
 * customer is created.
 *
 *   bun packages/ai/evals/router/live-check.ts
 */

import { withRouterDefaults } from "@notra/ai/provider-options";
import { createOpenRouterAdapter } from "@notra/ai/router/adapters/openrouter";
import { createVercelAdapter } from "@notra/ai/router/adapters/vercel";
import { createModelRouter } from "@notra/ai/router/create-router";
import type {
  GatewayAdapter,
  GatewayId,
  RouterLogFields,
} from "@notra/ai/types/router";
import { generateText, Output, streamText, tool } from "ai";
import { z } from "zod";

const MODEL = "anthropic/claude-haiku-4.5";
const MAX_OUTPUT_TOKENS = 60;
const PAID_ORG = "org_live_paid";
const FREE_ORG = "org_live_free";

const adapters: Partial<Record<GatewayId, GatewayAdapter>> = {};
if (process.env.AI_GATEWAY_API_KEY) {
  adapters.vercel = createVercelAdapter({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });
}
if (process.env.OPENROUTER_API_KEY) {
  adapters.openrouter = createOpenRouterAdapter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

const router = createModelRouter({
  adapters,
  resolvePlan: (organizationId) =>
    Promise.resolve(organizationId === PAID_ORG ? "paid" : "free"),
  policy: {
    defaultGateway: "openrouter",
    paidGateway: "vercel",
    freeGateway: "openrouter",
    allowNonZdr: false,
    crossGatewayFallback: true,
  },
  logger: {
    info: (event: string, fields?: RouterLogFields) =>
      console.log(`[info] ${event}`, fields),
    warn: (event: string, fields?: RouterLogFields) =>
      console.warn(`[warn] ${event}`, fields),
    error: (event: string, fields?: RouterLogFields) =>
      console.error(`[error] ${event}`, fields),
  },
});

async function check(label: string, organizationId: string | undefined) {
  console.log(`\n=== ${label} ===`);
  const decision = await router.assertRouteHasCredits({
    modelId: MODEL,
    organizationId,
  });
  console.log("decision", decision);

  const result = await generateText({
    model: router.model(MODEL, { organizationId }),
    prompt: "Reply with the single word: pong",
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    providerOptions: withRouterDefaults(undefined, { modelId: MODEL }),
  });
  console.log("text", result.text.trim());
  console.log(
    "route metadata",
    router.getRouteMetadata(result.providerMetadata)
  );
  console.log(
    "request body provider/gateway options",
    summarizeRequest(result)
  );
}

function summarizeRequest(result: { request?: { body?: unknown } }) {
  const body = result.request?.body;
  const parsed =
    typeof body === "string"
      ? (JSON.parse(body) as Record<string, unknown>)
      : body;
  if (!parsed || typeof parsed !== "object") {
    return parsed;
  }
  const record = parsed as Record<string, unknown>;
  return {
    model: record.model,
    provider: record.provider,
    providerOptions: record.providerOptions,
    usage: record.usage,
    models: record.models,
  };
}

async function checkStreamingWithTools() {
  console.log("\n=== streaming + tool call via openrouter ===");
  const stream = streamText({
    model: router.model(MODEL, { organizationId: FREE_ORG }),
    prompt: "What is 21 * 2? Use the multiply tool, then answer briefly.",
    tools: {
      multiply: tool({
        description: "Multiply two numbers",
        inputSchema: z.object({ a: z.number(), b: z.number() }),
        execute: ({ a, b }) => Promise.resolve({ product: a * b }),
      }),
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS * 4,
    stopWhen: ({ steps }) => steps.length >= 3,
    providerOptions: withRouterDefaults(undefined, { modelId: MODEL }),
  });
  let text = "";
  for await (const delta of stream.textStream) {
    text += delta;
  }
  const steps = await stream.steps;
  console.log("text", text.trim());
  console.log(
    "tool calls",
    steps.flatMap((step) => step.toolCalls.map((c) => c.toolName))
  );
  console.log(
    "route metadata per step",
    steps.map((step) => router.getRouteMetadata(step.providerMetadata))
  );
}

async function checkStructuredOutput() {
  console.log("\n=== structured output via openrouter ===");
  const result = await generateText({
    model: router.model(MODEL, { organizationId: FREE_ORG }),
    output: Output.object({
      schema: z.object({ city: z.string(), country: z.string() }),
    }),
    prompt: "Give me the capital of France as JSON.",
    maxOutputTokens: MAX_OUTPUT_TOKENS * 2,
  });
  console.log("object", result.output);
}

async function checkPinnedAndUnsupported() {
  console.log("\n=== unsupported model → fallback ===");
  const result = await generateText({
    model: router.model("google/gemini-3-flash", { organizationId: FREE_ORG }),
    prompt: "Reply with the single word: pong",
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });
  console.log("text", result.text.trim());
  console.log(
    "route metadata",
    router.getRouteMetadata(result.providerMetadata)
  );
}

await check("no organization → default (openrouter)", undefined);
await check("free organization → openrouter", FREE_ORG);
await check("paid organization → vercel", PAID_ORG);
await checkStreamingWithTools();
await checkStructuredOutput();
await checkPinnedAndUnsupported();
