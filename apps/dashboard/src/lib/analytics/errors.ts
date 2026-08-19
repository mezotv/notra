import { Data } from "effect";

export class AnalyticsTinybirdError extends Data.TaggedError(
  "AnalyticsTinybirdError"
)<{
  readonly label: string;
  readonly cause: unknown;
}> {}

export class AnalyticsDatabaseError extends Data.TaggedError(
  "AnalyticsDatabaseError"
)<{
  readonly label: string;
  readonly cause: unknown;
}> {}

export class AnalyticsRequestError extends Data.TaggedError(
  "AnalyticsRequestError"
)<{
  readonly label: string;
  readonly cause: unknown;
}> {}

export class AnalyticsAccountNotFoundError extends Data.TaggedError(
  "AnalyticsAccountNotFoundError"
)<{
  readonly username: string;
}> {}

export class TrackedAccountNotFoundError extends Data.TaggedError(
  "TrackedAccountNotFoundError"
)<{
  readonly trackedAccountId: string;
}> {}

export type AnalyticsRouterError =
  | AnalyticsAccountNotFoundError
  | AnalyticsDatabaseError
  | AnalyticsRequestError
  | TrackedAccountNotFoundError;

export class AnalyticsFlagEvaluationError extends Data.TaggedError(
  "AnalyticsFlagEvaluationError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}
