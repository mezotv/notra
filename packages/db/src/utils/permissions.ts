import { ORGANIZATION_SCOPES } from "../constants/permissions";
import type { OrganizationScope } from "../types/access-groups";

const ORGANIZATION_SCOPE_SET: ReadonlySet<string> = new Set(
  ORGANIZATION_SCOPES
);

export function isOrganizationScope(value: string): value is OrganizationScope {
  return ORGANIZATION_SCOPE_SET.has(value);
}

export function filterOrganizationScopes(
  values: string[]
): OrganizationScope[] {
  return values.filter(isOrganizationScope);
}
