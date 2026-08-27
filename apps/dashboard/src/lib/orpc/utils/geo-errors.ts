import type { GeoRouterError } from "@/lib/geo/errors";
import { toUnexpectedError } from "@/lib/orpc/effect";
import { badRequest, notFound, paymentRequired } from "@/lib/orpc/utils/errors";

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
    case "GeoBrandIdentityNotFoundError":
      return notFound("Brand identity not found");
    case "GeoBrandIdentityMissingError":
      return badRequest("Create a brand identity first");
    case "GeoSequenceNotFoundError":
      return notFound("Conversation not found");
    case "GeoSequenceRunUnavailableError":
      return badRequest(
        "No search-grounded engines are available under your privacy settings"
      );
    case "GeoSequenceRunError":
      console.error("[GEO] conversation run failed:", failure);
      return badRequest(failure.message);
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
    case "GeoWriterCreditsExhaustedError":
      return paymentRequired(failure.message);
    case "GeoContentBriefNotFoundError":
      return notFound("Brief not found");
    case "GeoContentBriefStateError":
      return badRequest(
        `This brief is already ${failure.status}. Start a new one.`
      );
    case "GeoWriterPlanError":
      console.error("[GEO] writer planning failed:", failure);
      return badRequest(failure.message);
    case "GeoWriterStartError":
      return toUnexpectedError(failure.cause, "Failed to start the writer");
    default:
      return toUnexpectedError(failure.cause, `[GEO] ${failure.label}`);
  }
}
