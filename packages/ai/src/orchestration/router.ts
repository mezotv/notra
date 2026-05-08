import { gateway } from "@notra/ai/gateway";
import {
  type AILogTarget,
  wrapModelWithObservability,
} from "@notra/ai/observability";
import { ROUTING_PROMPT } from "@notra/ai/prompts/router";
import { routingDecisionSchema } from "@notra/ai/schemas/orchestration";
import type {
  AutoSelection,
  RoutingDecision,
  RoutingResult,
} from "@notra/ai/types/orchestration";
import {
  buildExperimentalTelemetry,
  type TccMetadata,
} from "@notra/ai/utils/tcc";
import { generateText, Output } from "ai";

const MODELS = {
  router: "openai/gpt-oss-120b",
  simple: "openai/gpt-5.1-instant",
  complex: "anthropic/claude-haiku-4.5",
} as const;

const AUTO_POOL = {
  trivial: "anthropic/claude-haiku-4.5",
  everyday: "anthropic/claude-sonnet-4.6",
  deep: "anthropic/claude-opus-4.7",
} as const;

const TRIVIAL_MESSAGE_PATTERNS = [
  /^(hi|hello|hey|yo|sup|hallo|moin|servus)\b[\s!.?]*$/i,
  /^(thanks?|thank you|thx|danke|ty)\b[\s!.?]*$/i,
  /^(ok(ay)?|cool|nice|got it|alles klar)\b[\s!.?]*$/i,
  /^(bye|cya|tschüss|ciao)\b[\s!.?]*$/i,
];

export function isTrivialMessage(userMessage: string): boolean {
  const trimmed = userMessage.trim();
  if (!trimmed || trimmed.length > 40) {
    return false;
  }
  return TRIVIAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function matchTrivialFastPath(
  userMessage: string,
  hasIntegrationContext: boolean,
  hasAttachments: boolean
): RoutingDecision | undefined {
  if (hasIntegrationContext || hasAttachments) {
    return undefined;
  }
  if (!isTrivialMessage(userMessage)) {
    return undefined;
  }
  return {
    complexity: "simple",
    requiresTools: false,
    reasoningHeavy: false,
    reasoning: "Trivial greeting/acknowledgement — skipped router call",
  };
}

export function selectAutoModel(decision: RoutingDecision): AutoSelection {
  if (decision.complexity === "simple" && !decision.requiresTools) {
    return { model: AUTO_POOL.trivial, thinkingLevel: "off" };
  }
  if (decision.reasoningHeavy) {
    return { model: AUTO_POOL.deep, thinkingLevel: "high" };
  }
  if (decision.complexity === "complex") {
    return { model: AUTO_POOL.everyday, thinkingLevel: "medium" };
  }
  return { model: AUTO_POOL.everyday, thinkingLevel: "low" };
}

export async function routeMessage(
  userMessage: string,
  hasIntegrationContext: boolean,
  log?: AILogTarget,
  hasAttachments = false,
  telemetryMetadata?: TccMetadata
): Promise<RoutingDecision> {
  const fastPath = matchTrivialFastPath(
    userMessage,
    hasIntegrationContext,
    hasAttachments
  );
  if (fastPath) {
    return fastPath;
  }

  const contextHint = hasIntegrationContext
    ? "\n\nNote: The user has connected integration context (for example GitHub or Linear), so they may want help using external project data."
    : "";

  const routerModel = wrapModelWithObservability(gateway(MODELS.router), log);

  const { output } = await generateText({
    model: routerModel,
    output: Output.object({ schema: routingDecisionSchema }),
    system: ROUTING_PROMPT,
    prompt: `Classify this user message:

"${userMessage}"${contextHint}`,
    experimental_telemetry: buildExperimentalTelemetry(telemetryMetadata),
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
  hasIntegrationContext: boolean,
  log?: AILogTarget,
  hasAttachments = false,
  telemetryMetadata?: TccMetadata
): Promise<RoutingResult> {
  const decision = await routeMessage(
    userMessage,
    hasIntegrationContext,
    log,
    hasAttachments,
    telemetryMetadata
  );
  const model = selectModel(decision);

  return {
    model,
    complexity: decision.complexity,
    requiresTools: decision.requiresTools,
    reasoning: decision.reasoning,
  };
}
