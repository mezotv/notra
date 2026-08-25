import type { AgentFeedbackRouterError } from "@/lib/agent-feedback/errors";
import { toUnexpectedError } from "@/lib/orpc/effect";
import { notFound, serviceUnavailable } from "@/lib/orpc/utils/errors";

export function toAgentFeedbackOrpcError(
  failure: AgentFeedbackRouterError
): Error {
  switch (failure._tag) {
    case "AgentFeedbackNotFoundError":
      return notFound("Feedback not found");
    case "AgentFeedbackOrganizationNotFoundError":
      return notFound("Organization not found");
    case "AgentFeedbackTokenUnavailableError":
      return serviceUnavailable("Feedback tokens are not configured");
    default:
      return toUnexpectedError(
        failure.cause,
        `[agent-feedback] ${failure.label}`
      );
  }
}
