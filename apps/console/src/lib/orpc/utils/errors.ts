import { ORPCError } from "@orpc/server";

export function badRequest(message: string, data?: unknown) {
  return new ORPCError("BAD_REQUEST", {
    message,
    data,
  });
}

export function conflict(message: string, data?: unknown) {
  return new ORPCError("CONFLICT", {
    message,
    data,
  });
}

export function notFound(message = "Not Found") {
  return new ORPCError("NOT_FOUND", {
    message,
  });
}

export function internalServerError(message: string, cause?: unknown) {
  let resolvedCause: Error | undefined;
  if (cause instanceof Error) {
    resolvedCause = cause;
  } else if (cause !== undefined) {
    resolvedCause = new Error(String(cause));
  }

  return new ORPCError("INTERNAL_SERVER_ERROR", {
    cause: resolvedCause,
    message,
  });
}

export function tooManyRequests(message = "Too many requests") {
  return new ORPCError("TOO_MANY_REQUESTS", {
    message,
  });
}

export function unauthorized(message = "Unauthorized") {
  return new ORPCError("UNAUTHORIZED", {
    message,
  });
}
