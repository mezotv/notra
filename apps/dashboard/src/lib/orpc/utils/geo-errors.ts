import type { GeoRouterError } from "@/lib/geo/errors";
import { toUnexpectedError } from "@/lib/orpc/effect";
import { badRequest, notFound } from "@/lib/orpc/utils/errors";

export function toGeoOrpcError(failure: GeoRouterError): Error {
  switch (failure._tag) {
    case "GeoPromptCreateFailedError":
      return badRequest("Failed to create prompt");
    case "GeoPromptNotFoundError":
      return notFound("Prompt not found");
    case "GeoProjectNotFoundError":
      return notFound("Project not found");
    case "GeoProjectCreateFailedError":
      return badRequest("Failed to create project");
    case "GeoSequenceNotFoundError":
      return notFound("Conversation not found");
    case "GeoSequenceCreateFailedError":
      return badRequest("Failed to create conversation");
    case "GeoSettingsMissingError":
      return badRequest("Configure your brand tracking settings first");
    case "GeoSettingsDisabledError":
      return badRequest("Enable brand tracking before starting a scan");
    case "GeoSampleDataDisabledError":
      return notFound();
    case "GeoDiscoveryError":
      console.error("[GEO] website discovery failed:", failure);
      return badRequest(failure.message);
    case "GeoScanStartError":
      return toUnexpectedError(failure.cause, "Failed to start the scan");
    default:
      return toUnexpectedError(failure.cause, `[GEO] ${failure.label}`);
  }
}
