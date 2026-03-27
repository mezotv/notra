import { ORPCError } from "@orpc/server";
import type { ZodError } from "zod";

export function validationError(
  error: ZodError,
  message = "Validation failed"
) {
  return new ORPCError("BAD_REQUEST", {
    message,
    data: {
      issues: error.issues,
    },
  });
}

export function badRequest(message: string, data?: unknown) {
  return new ORPCError("BAD_REQUEST", {
    message,
    data,
  });
}

export function unauthorized(message = "Unauthorized") {
  return new ORPCError("UNAUTHORIZED", {
    message,
  });
}

export function forbidden(message = "Forbidden") {
  return new ORPCError("FORBIDDEN", {
    message,
  });
}

export function notFound(message = "Not Found") {
  return new ORPCError("NOT_FOUND", {
    message,
  });
}

export function conflict(message: string, data?: unknown) {
  return new ORPCError("CONFLICT", {
    message,
    data,
  });
}

export function tooManyRequests(message: string, data?: unknown) {
  return new ORPCError("TOO_MANY_REQUESTS", {
    message,
    data,
  });
}

export function paymentRequired(message: string, data?: unknown) {
  return new ORPCError("PAYMENT_REQUIRED", {
    status: 402,
    message,
    data,
  });
}

export function serviceUnavailable(message: string) {
  return new ORPCError("SERVICE_UNAVAILABLE", {
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
