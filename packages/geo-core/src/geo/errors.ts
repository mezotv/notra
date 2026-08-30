import type { AgentTokenUsage } from "@notra/ai/types/agents";
import type { FinishReason, LanguageModelUsage } from "ai";
import { Data } from "effect";

export class GeoScanError extends Data.TaggedError("GeoScanError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class GeoEmptyAnswerError extends Data.TaggedError(
  "GeoEmptyAnswerError"
)<{
  readonly message: string;
  readonly engine: string;
  readonly promptId: string;
  readonly language: string;
  readonly finishReason: FinishReason | null;
  readonly usage?: LanguageModelUsage;
}> {}

export class GeoJudgeError extends Data.TaggedError("GeoJudgeError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class GeoTranslationError extends Data.TaggedError(
  "GeoTranslationError"
)<{
  readonly message: string;
  readonly language: string;
  readonly cause?: unknown;
}> {}

export class GeoDiscoveryError extends Data.TaggedError("GeoDiscoveryError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class GeoTinybirdError extends Data.TaggedError("GeoTinybirdError")<{
  readonly label: string;
  readonly cause: unknown;
}> {}

export class GeoDatabaseError extends Data.TaggedError("GeoDatabaseError")<{
  readonly label: string;
  readonly cause: unknown;
}> {}

export class GeoCsvReadError extends Data.TaggedError("GeoCsvReadError")<{
  readonly cause: unknown;
}> {}

export class GeoPromptDuplicateError extends Data.TaggedError(
  "GeoPromptDuplicateError"
)<{
  readonly prompt: string;
}> {}

export class GeoPromptNotFoundError extends Data.TaggedError(
  "GeoPromptNotFoundError"
)<{
  readonly promptId: string;
}> {}

export class GeoCompetitorLimitError extends Data.TaggedError(
  "GeoCompetitorLimitError"
)<{
  readonly limit: number;
}> {}

export class GeoSettingsMissingError extends Data.TaggedError(
  "GeoSettingsMissingError"
)<{
  readonly organizationId: string;
}> {}

export class GeoSettingsDisabledError extends Data.TaggedError(
  "GeoSettingsDisabledError"
)<{
  readonly projectId: string;
}> {}

export class GeoScanStartError extends Data.TaggedError("GeoScanStartError")<{
  readonly cause: unknown;
}> {}

/**
 * A scan for this project is already in flight, so the caller lost the
 * atomic claim in `claimGeoScanRun`. Not retryable until the running scan
 * finishes or goes stale.
 */
export class GeoScanAlreadyRunningError extends Data.TaggedError(
  "GeoScanAlreadyRunningError"
)<{
  readonly projectId: string;
}> {}

/**
 * A pending QStash message could not be cancelled, so the operation that
 * depends on the cancellation (project deletion) was refused rather than
 * leaving a delayed job pointed at a row that no longer exists. Retryable:
 * the caller should try the same request again.
 */
export class GeoScheduleCancelError extends Data.TaggedError(
  "GeoScheduleCancelError"
)<{
  readonly projectId: string;
}> {}

export class GeoProjectNotFoundError extends Data.TaggedError(
  "GeoProjectNotFoundError"
)<{
  readonly projectId: string;
}> {}

export class GeoProjectCreateFailedError extends Data.TaggedError(
  "GeoProjectCreateFailedError"
)<Record<string, never>> {}

/**
 * A project exists and belongs to the organization, but deleting it is not
 * allowed — currently only when it is the organization's last project, which
 * every GEO scope resolution depends on.
 */
export class GeoProjectDeleteBlockedError extends Data.TaggedError(
  "GeoProjectDeleteBlockedError"
)<{
  readonly projectId: string;
  readonly reason: "last_project";
}> {}

export class GeoBrandIdentityNotFoundError extends Data.TaggedError(
  "GeoBrandIdentityNotFoundError"
)<{
  readonly brandSettingsId: string;
}> {}

export class GeoBrandIdentityMissingError extends Data.TaggedError(
  "GeoBrandIdentityMissingError"
)<{
  readonly organizationId: string;
}> {}

export class GeoSequenceNotFoundError extends Data.TaggedError(
  "GeoSequenceNotFoundError"
)<{
  readonly sequenceId: string;
}> {}

export class GeoSequenceCreateFailedError extends Data.TaggedError(
  "GeoSequenceCreateFailedError"
)<Record<string, never>> {}

export class GeoSequenceEmptyError extends Data.TaggedError(
  "GeoSequenceEmptyError"
)<{
  readonly usage: AgentTokenUsage;
}> {}

export class GeoSequenceRunUnavailableError extends Data.TaggedError(
  "GeoSequenceRunUnavailableError"
)<Record<string, never>> {}

export class GeoSequenceRunError extends Data.TaggedError(
  "GeoSequenceRunError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class GeoSampleDataDisabledError extends Data.TaggedError(
  "GeoSampleDataDisabledError"
)<Record<string, never>> {}

export class GeoCursorFlagEvaluationError extends Data.TaggedError(
  "GeoCursorFlagEvaluationError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class GeoWriterCreditsExhaustedError extends Data.TaggedError(
  "GeoWriterCreditsExhaustedError"
)<{
  readonly message: string;
}> {}

export class GeoContentBriefNotFoundError extends Data.TaggedError(
  "GeoContentBriefNotFoundError"
)<{
  readonly briefId: string;
}> {}

export class GeoContentBriefStateError extends Data.TaggedError(
  "GeoContentBriefStateError"
)<{
  readonly briefId: string;
  readonly status: string;
}> {}

export class GeoWriterPlanError extends Data.TaggedError("GeoWriterPlanError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class GeoWriterStartError extends Data.TaggedError(
  "GeoWriterStartError"
)<{
  readonly cause: unknown;
}> {}

export type GeoRouterError =
  | GeoBrandIdentityMissingError
  | GeoBrandIdentityNotFoundError
  | GeoCompetitorLimitError
  | GeoContentBriefNotFoundError
  | GeoContentBriefStateError
  | GeoDatabaseError
  | GeoDiscoveryError
  | GeoProjectCreateFailedError
  | GeoProjectDeleteBlockedError
  | GeoProjectNotFoundError
  | GeoPromptDuplicateError
  | GeoPromptNotFoundError
  | GeoSampleDataDisabledError
  | GeoScanAlreadyRunningError
  | GeoScanStartError
  | GeoScheduleCancelError
  | GeoSequenceCreateFailedError
  | GeoSequenceNotFoundError
  | GeoSequenceRunError
  | GeoSequenceRunUnavailableError
  | GeoSettingsDisabledError
  | GeoSettingsMissingError
  | GeoTinybirdError
  | GeoWriterCreditsExhaustedError
  | GeoWriterPlanError
  | GeoWriterStartError;
