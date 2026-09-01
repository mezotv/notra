import type { AnalyticsRouterError } from "@/lib/analytics/errors";
import { toUnexpectedError } from "@/lib/orpc/effect";
import { badRequest, notFound } from "@/lib/orpc/utils/errors";

export function toAnalyticsOrpcError(failure: AnalyticsRouterError): Error {
  switch (failure._tag) {
    case "AnalyticsAccountNotFoundError":
      return badRequest(`Could not find the X account @${failure.username}`);
    case "TrackedAccountNotFoundError":
      return notFound("Tracked account not found");
    default:
      return toUnexpectedError(failure.cause, `[Analytics] ${failure.label}`);
  }
}
