import { Data } from "effect";

export class GeoScanError extends Data.TaggedError("GeoScanError")<{
  readonly message: string;
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

export class GeoPromptCreateFailedError extends Data.TaggedError(
  "GeoPromptCreateFailedError"
)<Record<string, never>> {}

export class GeoPromptNotFoundError extends Data.TaggedError(
  "GeoPromptNotFoundError"
)<{
  readonly promptId: string;
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

export class GeoProjectNotFoundError extends Data.TaggedError(
  "GeoProjectNotFoundError"
)<{
  readonly projectId: string;
}> {}

export class GeoProjectCreateFailedError extends Data.TaggedError(
  "GeoProjectCreateFailedError"
)<Record<string, never>> {}

export class GeoSequenceNotFoundError extends Data.TaggedError(
  "GeoSequenceNotFoundError"
)<{
  readonly sequenceId: string;
}> {}

export class GeoSequenceCreateFailedError extends Data.TaggedError(
  "GeoSequenceCreateFailedError"
)<Record<string, never>> {}

export class GeoSampleDataDisabledError extends Data.TaggedError(
  "GeoSampleDataDisabledError"
)<Record<string, never>> {}

export type GeoRouterError =
  | GeoDatabaseError
  | GeoDiscoveryError
  | GeoProjectCreateFailedError
  | GeoProjectNotFoundError
  | GeoPromptCreateFailedError
  | GeoPromptNotFoundError
  | GeoSampleDataDisabledError
  | GeoScanStartError
  | GeoSequenceCreateFailedError
  | GeoSequenceNotFoundError
  | GeoSettingsDisabledError
  | GeoSettingsMissingError
  | GeoTinybirdError;
