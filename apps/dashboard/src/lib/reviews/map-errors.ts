import type { ORPCError } from "@orpc/server";
import {
  badRequest,
  forbidden,
  internalServerError,
} from "@/lib/orpc/utils/errors";
import type { ScopeResolutionError } from "@/lib/permissions/errors";
import type {
  PublishBlockedError,
  ReviewPermissionError,
  ReviewPersistenceError,
  ReviewStateError,
} from "@/lib/reviews/errors";

type ReviewWorkflowError =
  | PublishBlockedError
  | ReviewPermissionError
  | ReviewPersistenceError
  | ReviewStateError
  | ScopeResolutionError;

export function toReviewOrpcError(
  error: ReviewWorkflowError
): ORPCError<string, unknown> {
  switch (error._tag) {
    case "ReviewStateError":
      return badRequest(error.message);
    case "ReviewPermissionError":
    case "PublishBlockedError":
      return forbidden(error.message);
    default:
      return internalServerError(error.message, error.cause);
  }
}
