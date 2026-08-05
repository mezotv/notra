import type { GeoRouterError } from "@/lib/geo/errors";
import { toUnexpectedError } from "@/lib/orpc/effect";
import { badRequest, notFound } from "@/lib/orpc/utils/errors";

export function toGeoOrpcError(failure: GeoRouterError): Error {
  switch (failure._tag) {
    case "GeoPromptCreateFailedError":
      return badRequest("Failed to create prompt");
    case "GeoPromptNotFoundError":
      return notFound("Prompt not found");
    case "GeoSettingsMissingError":
      return badRequest("Configure your brand tracking settings first");
    case "GeoDiscoveryError":
      console.error("[GEO] website discovery failed:", failure);
      return badRequest(failure.message);
    case "GeoScanStartError":
      return toUnexpectedError(failure.cause, "Failed to start the scan");
    default:
      return toUnexpectedError(failure.cause, `[GEO] ${failure.label}`);
  }
}
