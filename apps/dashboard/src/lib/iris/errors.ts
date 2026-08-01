import { Data } from "effect";

export class IrisMandateLoadError extends Data.TaggedError(
  "IrisMandateLoadError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class IrisWakeScheduleError extends Data.TaggedError(
  "IrisWakeScheduleError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class IrisSignalRecordingError extends Data.TaggedError(
  "IrisSignalRecordingError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class IrisRunStoreError extends Data.TaggedError("IrisRunStoreError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class IrisFlagEvaluationError extends Data.TaggedError(
  "IrisFlagEvaluationError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}
