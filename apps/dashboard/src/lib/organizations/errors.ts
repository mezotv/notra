import { Data } from "effect";

export class OrganizationActionError extends Data.TaggedError(
  "OrganizationActionError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkOSSyncError extends Data.TaggedError("WorkOSSyncError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}
