import type { createDb } from "@notra/db/drizzle";

import type { getOrganizationResponse } from "../utils/organizations";

type ApiDbClient = ReturnType<typeof createDb>;

type ApiOrganization = NonNullable<
  Awaited<ReturnType<typeof getOrganizationResponse>>
>;

export interface GeoRequestContext {
  readonly db: ApiDbClient;
  readonly organization: ApiOrganization;
  readonly organizationId: string;
}

type ApiOrganizationLoader = (
  db: ApiDbClient,
  organizationId: string
) => Promise<ApiOrganization | undefined>;

type GeoProjectOwnershipCheck = (
  db: ApiDbClient,
  organizationId: string,
  projectId: string
) => Promise<boolean>;

export interface GeoContextMiddlewareOptions {
  readonly loadOrganization?: ApiOrganizationLoader;
}

export interface GeoProjectContextMiddlewareOptions {
  readonly projectBelongsToOrganization?: GeoProjectOwnershipCheck;
}
