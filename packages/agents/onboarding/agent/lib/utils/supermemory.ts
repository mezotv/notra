import { Effect } from "effect";
import { SUPERMEMORY_BASE_URL } from "../constants/supermemory";
import { ToolOperationError } from "../schemas/retry";
import { isRetryableHttpStatus, isTransientError } from "./retry";

const getSupermemoryHeaders = Effect.fn("getSupermemoryHeaders")(function* () {
  const apiKey = process.env.SUPERMEMORY_API_KEY?.trim();
  if (!apiKey) {
    return yield* new ToolOperationError({
      cause: new Error("SUPERMEMORY_API_KEY is not configured"),
      operationName: "Supermemory configuration",
      retryable: false,
    });
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
});

export function getOrganizationContainerTag(organizationId: string) {
  const trimmed = organizationId.trim();
  if (!trimmed) {
    throw new Error("organizationId must be a non-empty string");
  }
  return trimmed;
}

export const requestSupermemoryEffect = Effect.fn("requestSupermemory")(
  function* (path: string, body: unknown) {
    const operationName = `Supermemory request to ${path}`;
    const headers = yield* getSupermemoryHeaders();
    const response = yield* Effect.tryPromise({
      try: (signal) =>
        fetch(`${SUPERMEMORY_BASE_URL}${path}`, {
          body: JSON.stringify(body),
          headers,
          method: "POST",
          signal,
        }),
      catch: (cause) =>
        new ToolOperationError({
          cause,
          operationName,
          retryable: isTransientError(cause),
        }),
    });

    if (!response.ok) {
      const text = yield* Effect.tryPromise({
        try: () => response.text(),
        catch: (cause) =>
          new ToolOperationError({
            cause,
            operationName,
            retryable: isTransientError(cause),
            status: response.status,
          }),
      });
      return yield* new ToolOperationError({
        cause: new Error(
          `${operationName} failed with status ${response.status}: ${text || "empty response"}`
        ),
        operationName,
        retryable: isRetryableHttpStatus(response.status),
        status: response.status,
      });
    }

    return yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (cause) =>
        new ToolOperationError({
          cause,
          operationName,
          retryable: isTransientError(cause),
          status: response.status,
        }),
    });
  }
);
