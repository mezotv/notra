import type { organizations } from "@notra/db/schema";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface ActionError {
  message: string;
}

export interface ActionResult<T> {
  data: T | null;
  error: ActionError | null;
}

export type OrganizationRow = typeof organizations.$inferSelect;

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  logo?: string;
  keepCurrentActiveOrganization?: boolean;
}

export interface SetActiveOrganizationInput {
  organizationId?: string;
  organizationSlug?: string;
}
