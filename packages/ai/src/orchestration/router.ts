import { gateway } from "@notra/ai/gateway";
import {
  type AILogTarget,
  wrapModelWithObservability,
} from "@notra/ai/observability";
import { ROUTING_PROMPT } from "@notra/ai/prompts/router";
import { routingDecisionSchema } from "@notra/ai/schemas/orchestration";
import type {
  RoutingDecision,
  RoutingResult,
} from "@notra/ai/types/orchestration";
import { generateText, Output } from "ai";

const MODELS = {
  router: "openai/gpt-oss-120b",
  simple: "openai/gpt-5.1-instant",
  complex: "anthropic/claude-haiku-4.5",
} as const;

export async function routeMessage(
  userMessage: string,
  hasGitHubContext: boolean,
  log?: AILogTarget
): Promise<RoutingDecision> {
  const contextHint = hasGitHubContext
    ? "\n\nNote: The user has added GitHub repository context, suggesting they may want to work with GitHub data."
    : "";

  const routerModel = wrapModelWithObservability(gateway(MODELS.router), log);

  const { output } = await generateText({
    model: routerModel,
    output: Output.object({ schema: routingDecisionSchema }),
    system: ROUTING_PROMPT,
    prompt: `Classify this user message:

"${userMessage}"${contextHint}`,
  });

  return output;
}

export function selectModel(decision: RoutingDecision): string {
  if (decision.complexity === "complex") {
    return MODELS.complex;
  }
  return MODELS.simple;
}

export async function routeAndSelectModel(
  userMessage: string,
  hasGitHubContext: boolean,
  log?: AILogTarget
): Promise<RoutingResult> {
  const decision = await routeMessage(userMessage, hasGitHubContext, log);
  const model = selectModel(decision);

  return {
    model,
    complexity: decision.complexity,
    requiresTools: decision.requiresTools,
    reasoning: decision.reasoning,
  };
}
