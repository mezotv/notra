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

export class GeoScanStartError extends Data.TaggedError("GeoScanStartError")<{
  readonly cause: unknown;
}> {}

export type GeoRouterError =
  | GeoDatabaseError
  | GeoDiscoveryError
  | GeoPromptCreateFailedError
  | GeoPromptNotFoundError
  | GeoScanStartError
  | GeoSettingsMissingError;
