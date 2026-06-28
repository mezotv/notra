import {
  OAUTH_SCOPE_LEVEL,
  OAUTH_SCOPE_RESOURCES,
  OAUTH_SUPPORTED_SCOPES,
} from "@/constants/oauth";
import type { OAuthScopeGroup, OAuthScopeLevel } from "@/types/oauth";

const SCOPE_ORDER = new Map(
  OAUTH_SUPPORTED_SCOPES.map((scope, index) => [scope as string, index])
);

function buildResourceLevels(
  hasRead: boolean,
  hasWrite: boolean,
  readScope: string,
  writeScope: string
): OAuthScopeLevel[] {
  const levels: OAuthScopeLevel[] = [
    {
      value: OAUTH_SCOPE_LEVEL.none,
      label: "None",
      tone: "neutral",
      scopes: [],
    },
  ];

  if (hasRead) {
    levels.push({
      value: OAUTH_SCOPE_LEVEL.read,
      label: "Read",
      tone: "success",
      scopes: [readScope],
    });
  }

  if (hasWrite) {
    levels.push({
      value: OAUTH_SCOPE_LEVEL.write,
      label: "Write",
      tone: "warning",
      scopes: hasRead ? [readScope, writeScope] : [writeScope],
    });
  }

  return levels;
}

export function buildScopeGroups(requestedScopes: string[]): OAuthScopeGroup[] {
  const requested = new Set(requestedScopes);
  const groups: OAuthScopeGroup[] = [];

  for (const resource of OAUTH_SCOPE_RESOURCES) {
    const hasRead = requested.has(resource.readScope);
    const hasWrite = requested.has(resource.writeScope);
    if (!(hasRead || hasWrite)) {
      continue;
    }

    groups.push({
      id: resource.id,
      label: resource.label,
      description: resource.description,
      scopes: [resource.readScope, resource.writeScope].filter((scope) =>
        requested.has(scope)
      ),
      levels: buildResourceLevels(
        hasRead,
        hasWrite,
        resource.readScope,
        resource.writeScope
      ),
    });
  }

  return groups;
}

export function deriveScopeLevel(
  selected: Set<string>,
  group: OAuthScopeGroup
): string {
  const grantedCount = group.scopes.filter((scope) =>
    selected.has(scope)
  ).length;

  const reversedLevels = [...group.levels].reverse();
  const matchedLevel = reversedLevels.find(
    (level) =>
      level.scopes.length === grantedCount &&
      level.scopes.every((scope) => selected.has(scope))
  );

  return (matchedLevel ?? group.levels[0])?.value ?? OAUTH_SCOPE_LEVEL.none;
}

export function applyScopeLevel(
  selected: Set<string>,
  group: OAuthScopeGroup,
  levelValue: string
): Set<string> {
  const next = new Set(selected);

  for (const scope of group.scopes) {
    next.delete(scope);
  }

  const level = group.levels.find((item) => item.value === levelValue);
  if (level) {
    for (const scope of level.scopes) {
      next.add(scope);
    }
  }

  return next;
}

export function serializeScopes(selected: Set<string>): string {
  return [...selected]
    .filter((scope) => SCOPE_ORDER.has(scope))
    .sort((a, b) => (SCOPE_ORDER.get(a) ?? 0) - (SCOPE_ORDER.get(b) ?? 0))
    .join(" ");
}
