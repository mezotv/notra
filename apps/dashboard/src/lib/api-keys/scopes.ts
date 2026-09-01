import {
  expandLegacyApiScopes,
  getUnknownApiScopes,
  sortApiScopes,
} from "@notra/utils/api-scopes";

import {
  API_KEY_ACCESS_MODE_VALUES,
  API_KEY_GEO_SCOPES,
  API_KEY_GRANULAR_PERMISSIONS,
  API_KEY_GRANULAR_READ_PERMISSIONS,
  API_KEY_SCOPE_LEVEL,
  API_KEY_SCOPE_LEVEL_LABELS,
  API_KEY_SCOPE_RESOURCES,
} from "@/constants/api-keys";
import type {
  ApiKeyAccessMode,
  ApiKeyGranularScope,
  ApiKeyScopeGroup,
} from "@/types/api-keys";

const READ_SCOPE_SET: ReadonlySet<string> = new Set(
  API_KEY_GRANULAR_READ_PERMISSIONS
);

export const API_KEY_SCOPE_GROUPS: ApiKeyScopeGroup[] =
  API_KEY_SCOPE_RESOURCES.map((resource) => ({
    id: resource.id,
    label: resource.label,
    description: resource.description,
    readScope: resource.readScope,
    writeScope: resource.writeScope,
    levels: [
      {
        value: API_KEY_SCOPE_LEVEL.none,
        label: API_KEY_SCOPE_LEVEL_LABELS.none,
        tone: "neutral",
        scopes: [],
      },
      {
        value: API_KEY_SCOPE_LEVEL.read,
        label: API_KEY_SCOPE_LEVEL_LABELS.read,
        tone: "success",
        scopes: [resource.readScope],
      },
      {
        value: API_KEY_SCOPE_LEVEL.write,
        label: API_KEY_SCOPE_LEVEL_LABELS.write,
        tone: "warning",
        scopes: [resource.readScope, resource.writeScope],
      },
    ],
  }));

export function deriveScopeLevel(
  selected: Set<string>,
  group: ApiKeyScopeGroup
): string {
  if (selected.has(group.writeScope)) {
    return API_KEY_SCOPE_LEVEL.write;
  }
  if (selected.has(group.readScope)) {
    return API_KEY_SCOPE_LEVEL.read;
  }
  return API_KEY_SCOPE_LEVEL.none;
}

export function applyScopeLevel(
  selected: Set<string>,
  group: ApiKeyScopeGroup,
  levelValue: string
): Set<string> {
  const next = new Set(selected);
  next.delete(group.readScope);
  next.delete(group.writeScope);

  const level = group.levels.find((item) => item.value === levelValue);
  if (level) {
    for (const scope of level.scopes) {
      next.add(scope);
    }
  }

  return next;
}

export const expandLegacyApiKeyScopes = expandLegacyApiScopes;

export const sortApiKeyScopes = sortApiScopes;

export const getUnknownApiKeyPermissions = getUnknownApiScopes;

function hasExactScopes(
  scopes: readonly string[],
  expected: readonly string[]
) {
  const selected = new Set(scopes);
  return (
    selected.size === expected.length &&
    expected.every((scope) => selected.has(scope))
  );
}

export function getApiKeyAccessMode(
  scopes: readonly string[]
): ApiKeyAccessMode {
  if (hasExactScopes(scopes, API_KEY_GRANULAR_PERMISSIONS)) {
    return API_KEY_ACCESS_MODE_VALUES[0];
  }
  if (hasExactScopes(scopes, API_KEY_GEO_SCOPES)) {
    return API_KEY_ACCESS_MODE_VALUES[1];
  }
  return API_KEY_ACCESS_MODE_VALUES[2];
}

export function getApiKeyScopesForAccessMode(
  mode: ApiKeyAccessMode,
  currentScopes: readonly string[]
): ApiKeyGranularScope[] {
  if (mode === "full") {
    return [...API_KEY_GRANULAR_PERMISSIONS];
  }
  if (mode === "geo") {
    return [...API_KEY_GEO_SCOPES];
  }
  if (getApiKeyAccessMode(currentScopes) === "restricted") {
    return sortApiKeyScopes([...currentScopes]);
  }
  return sortApiKeyScopes(
    currentScopes.filter((scope) => READ_SCOPE_SET.has(scope))
  );
}

export function summarizeApiKeyScopes(scopes: readonly string[]) {
  const selected = new Set(scopes);
  if (selected.size === 0) {
    return "none" as const;
  }

  const everyWrite = API_KEY_SCOPE_GROUPS.every((group) =>
    selected.has(group.writeScope)
  );
  if (everyWrite) {
    return "write" as const;
  }

  if (hasExactScopes(scopes, API_KEY_GEO_SCOPES)) {
    return "geo" as const;
  }

  const everyReadOnly = API_KEY_SCOPE_GROUPS.every(
    (group) => selected.has(group.readScope) && !selected.has(group.writeScope)
  );
  if (everyReadOnly) {
    return "read" as const;
  }

  return "custom" as const;
}
