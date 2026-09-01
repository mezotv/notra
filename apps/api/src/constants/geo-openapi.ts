import { API_SCOPE_RESOURCES } from "@notra/utils/api-scopes";

import { errorResponse } from "../utils/openapi-responses";

const GEO_RESOURCE = API_SCOPE_RESOURCES.find(
  (resource) => resource.id === "projects"
);

if (!GEO_RESOURCE) {
  throw new Error("The projects API scope resource is not registered");
}

export const GEO_OPENAPI_TAG = GEO_RESOURCE.openApiTag;

export const GEO_COMMON_ERROR_RESPONSES = {
  400: errorResponse("Invalid request"),
  401: errorResponse("Missing or invalid API key"),
  402: errorResponse("GEO plan or available AI credits required"),
  403: errorResponse("Forbidden"),
  404: errorResponse("Organization, project or resource not found"),
  409: errorResponse("Conflict"),
  500: errorResponse("Internal server error"),
  503: errorResponse("Authentication or billing service unavailable"),
};
