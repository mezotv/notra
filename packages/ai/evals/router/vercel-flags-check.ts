/**
 * Probe which privacy flags the current Vercel AI Gateway team accepts.
 *
 *   bun packages/ai/evals/router/vercel-flags-check.ts
 */
import { createGateway } from "@ai-sdk/gateway";
import type { JSONObject } from "@ai-sdk/provider";
import { generateText } from "ai";

const MODEL = "anthropic/claude-haiku-4.5";
const MAX_OUTPUT_TOKENS = 20;

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });

async function probe(label: string, options: JSONObject) {
  try {
    const result = await generateText({
      model: gateway(MODEL),
      prompt: "Reply with the single word: pong",
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      providerOptions: { gateway: options },
    });
    console.log(`${label}: ok →`, result.text.trim());
  } catch (error) {
    console.log(
      `${label}: FAILED →`,
      error instanceof Error ? error.message.slice(0, 160) : error
    );
  }
}

await probe("no flags", {});
await probe("disallowPromptTraining only", { disallowPromptTraining: true });
await probe("zeroDataRetention only", { zeroDataRetention: true });
