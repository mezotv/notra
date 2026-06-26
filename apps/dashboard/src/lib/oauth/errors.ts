import { Data } from "effect";

export class OAuthInvalidGrantError extends Data.TaggedError(
  "OAuthInvalidGrantError"
)<{
  readonly message: string;
}> {}

export class OAuthStorageError extends Data.TaggedError("OAuthStorageError")<{
  readonly operation: string;
  readonly cause: unknown;
}> {}
