import { ORPCError } from "@orpc/server";

const SERVER_ERROR_STATUS_THRESHOLD = 500;

export function isServerFailureError(error: unknown): boolean {
  if (error instanceof ORPCError) {
    return error.status >= SERVER_ERROR_STATUS_THRESHOLD;
  }
  return true;
}
