import { Data } from "effect";

export class AuthSessionError extends Data.TaggedError("AuthSessionError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class UserSyncError extends Data.TaggedError("UserSyncError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkOSAuthError extends Data.TaggedError("WorkOSAuthError")<{
  readonly error: unknown;
}> {}
