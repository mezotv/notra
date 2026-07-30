import type {
  OrganizationScope,
  ScopeGroup,
} from "@notra/db/types/access-groups";
import type { AccessGroupScopeSummary } from "@/types/settings/access-groups";
import { MAX_VISIBLE_SCOPE_LABELS } from "./constants";

export function buildScopeLabels(groups: ScopeGroup[]): Record<string, string> {
  const labels: Record<string, string> = {};

  for (const group of groups) {
    for (const scope of group.scopes) {
      labels[scope.scope] = `${group.label}: ${scope.label}`;
    }
  }

  return labels;
}

export function toggleScope(
  scopes: OrganizationScope[],
  scope: OrganizationScope
): OrganizationScope[] {
  if (scopes.includes(scope)) {
    return scopes.filter((current) => current !== scope);
  }

  return [...scopes, scope];
}

export function summarizeScopes(
  scopes: OrganizationScope[],
  labels: Record<string, string>
): AccessGroupScopeSummary {
  const visible = scopes
    .slice(0, MAX_VISIBLE_SCOPE_LABELS)
    .map((scope) => labels[scope] ?? scope);

  return {
    visible,
    remaining: Math.max(0, scopes.length - MAX_VISIBLE_SCOPE_LABELS),
  };
}

export function formatMemberCount(count: number): string {
  return count === 1 ? "1 member" : `${count} members`;
}
