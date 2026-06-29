import {
  API_KEY_GRANULAR_PERMISSIONS,
  API_KEY_GRANULAR_READ_PERMISSIONS,
  API_KEY_LEGACY_PERMISSIONS,
  API_KEY_SCOPE_LEVEL,
  API_KEY_SCOPE_LEVEL_LABELS,
  API_KEY_SCOPE_RESOURCES,
} from "@/constants/api-keys";
import type { ApiKeyGranularScope, ApiKeyScopeGroup } from "@/types/api-keys";

const GRANULAR_SCOPE_SET: ReadonlySet<string> = new Set(
  API_KEY_GRANULAR_PERMISSIONS
);
const LEGACY_SCOPE_SET: ReadonlySet<string> = new Set(
  API_KEY_LEGACY_PERMISSIONS
);

const SCOPE_ORDER = new Map(
  API_KEY_GRANULAR_PERMISSIONS.map((scope, index) => [scope as string, index])
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

export function expandLegacyApiKeyScopes(
  scopes: readonly string[]
): ApiKeyGranularScope[] {
  const next = new Set<string>();

  for (const scope of scopes) {
    if (GRANULAR_SCOPE_SET.has(scope)) {
      next.add(scope);
      continue;
    }
    if (scope === "api.write") {
      for (const granular of API_KEY_GRANULAR_PERMISSIONS) {
        next.add(granular);
      }
      continue;
    }
    if (scope === "api.read") {
      for (const granular of API_KEY_GRANULAR_READ_PERMISSIONS) {
        next.add(granular);
      }
    }
  }

  return sortApiKeyScopes([...next]);
}

export function sortApiKeyScopes(scopes: string[]): ApiKeyGranularScope[] {
  return scopes
    .filter((scope): scope is ApiKeyGranularScope =>
      GRANULAR_SCOPE_SET.has(scope)
    )
    .sort((a, b) => (SCOPE_ORDER.get(a) ?? 0) - (SCOPE_ORDER.get(b) ?? 0));
}

export function getUnknownApiKeyPermissions(scopes: readonly string[]) {
  return scopes.filter(
    (scope) => !(GRANULAR_SCOPE_SET.has(scope) || LEGACY_SCOPE_SET.has(scope))
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

  const everyReadOnly = API_KEY_SCOPE_GROUPS.every(
    (group) => selected.has(group.readScope) && !selected.has(group.writeScope)
  );
  if (everyReadOnly) {
    return "read" as const;
  }

  return "custom" as const;
}
