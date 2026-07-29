import { Data } from "effect";

export class ReviewPersistenceError extends Data.TaggedError(
  "ReviewPersistenceError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class ReviewStateError extends Data.TaggedError("ReviewStateError")<{
  readonly message: string;
}> {}

export class ReviewPermissionError extends Data.TaggedError(
  "ReviewPermissionError"
)<{
  readonly message: string;
}> {}

export class PublishBlockedError extends Data.TaggedError(
  "PublishBlockedError"
)<{
  readonly message: string;
}> {}
