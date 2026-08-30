import type { Context, Next } from "hono";

import {
  GEO_PROJECT_NOT_FOUND_ERROR,
  ORGANIZATION_SCOPED_API_KEY_ERROR,
} from "../constants/geo";
import type { ApiEnv } from "../types/env";
import type {
  GeoContextMiddlewareOptions,
  GeoProjectContextMiddlewareOptions,
} from "../types/geo-context";
import { getOrganizationId } from "../utils/auth";
import { projectBelongsToOrganization } from "../utils/geo";
import { getOrganizationResponse } from "../utils/organizations";

export function geoContextMiddleware(
  options: GeoContextMiddlewareOptions = {}
) {
  const loadOrganization = options.loadOrganization ?? getOrganizationResponse;

  return async (c: Context<ApiEnv>, next: Next) => {
    const organizationId = getOrganizationId(c);
    if (!organizationId) {
      return c.json({ error: ORGANIZATION_SCOPED_API_KEY_ERROR }, 403);
    }

    const db = c.get("db");
    const organization = await loadOrganization(db, organizationId);
    if (!organization) {
      return c.json({ error: "Organization not found" }, 404);
    }

    c.set("geo", { db, organization, organizationId });
    await next();
  };
}

export function geoProjectContextMiddleware(
  options: GeoProjectContextMiddlewareOptions = {}
) {
  const ownsProject =
    options.projectBelongsToOrganization ?? projectBelongsToOrganization;

  return async (c: Context<ApiEnv>, next: Next) => {
    const projectId = c.req.param("projectId");
    const { db, organizationId } = c.get("geo");
    if (!projectId || !(await ownsProject(db, organizationId, projectId))) {
      return c.json({ error: GEO_PROJECT_NOT_FOUND_ERROR }, 404);
    }

    await next();
  };
}
