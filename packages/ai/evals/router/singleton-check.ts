/**
 * Exercise the env-configured router singleton exactly like app code does.
 *
 *   AI_ROUTER_MODE=on bun packages/ai/evals/router/singleton-check.ts
 */
import {
  gateway,
  getRouteMetadata,
  resolveModelRoute,
} from "@notra/ai/gateway";
import { withRouterDefaults } from "@notra/ai/provider-options";
import { generateText } from "ai";

const MODEL = "anthropic/claude-haiku-4.5";
const MAX_OUTPUT_TOKENS = 20;

console.log("AI_ROUTER_MODE =", process.env.AI_ROUTER_MODE ?? "(unset)");
console.log("decision (no org):", await resolveModelRoute({ modelId: MODEL }));

const result = await generateText({
  model: gateway(MODEL),
  prompt: "Reply with the single word: pong",
  maxOutputTokens: MAX_OUTPUT_TOKENS,
  providerOptions: withRouterDefaults(undefined, { modelId: MODEL }),
});
console.log("text:", result.text.trim());
console.log("route:", getRouteMetadata(result.providerMetadata));
