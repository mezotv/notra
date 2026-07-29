import { Data } from "effect";

export class ScopeResolutionError extends Data.TaggedError(
  "ScopeResolutionError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}
