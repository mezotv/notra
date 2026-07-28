import { Data } from "effect";

export function getSocialConnectStatusCode(cause: unknown): number | null {
  if (!(cause instanceof Error)) {
    return null;
  }
  if ("statusCode" in cause && typeof cause.statusCode === "number") {
    return cause.statusCode;
  }
  if ("status" in cause && typeof cause.status === "number") {
    return cause.status;
  }
  return null;
}

export class SocialConnectConfigError extends Data.TaggedError(
  "SocialConnectConfigError"
)<{
  readonly message: string;
}> {}

export class SocialConnectRequestError extends Data.TaggedError(
  "SocialConnectRequestError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class SocialConnectCallbackError extends Data.TaggedError(
  "SocialConnectCallbackError"
)<{
  readonly code: string;
  readonly cause?: unknown;
}> {}
