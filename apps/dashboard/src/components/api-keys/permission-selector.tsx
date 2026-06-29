"use client";

import {
  PermissionOption,
  PermissionRow,
  PermissionSelector,
} from "@notra/ui/components/ui/permission-selector";
import {
  API_KEY_SCOPE_GROUPS,
  applyScopeLevel,
  deriveScopeLevel,
  sortApiKeyScopes,
} from "@/lib/api-keys/scopes";
import type {
  ApiKeyPermissionSelectorProps,
  ApiKeyScopeGroup,
} from "@/types/api-keys";

export function ApiKeyPermissionSelector({
  value,
  onValueChange,
  disabled,
  className,
}: ApiKeyPermissionSelectorProps) {
  const selected = new Set(value);

  const handleLevelChange = (group: ApiKeyScopeGroup, levelValue: string) => {
    onValueChange(
      sortApiKeyScopes([...applyScopeLevel(selected, group, levelValue)])
    );
  };

  return (
    <PermissionSelector className={className} label="API key permissions">
      {API_KEY_SCOPE_GROUPS.map((group) => (
        <PermissionRow
          description={group.description}
          disabled={disabled}
          key={group.id}
          label={group.label}
          onValueChange={(levelValue) => handleLevelChange(group, levelValue)}
          value={deriveScopeLevel(selected, group)}
        >
          {group.levels.map((level) => (
            <PermissionOption
              key={level.value}
              tone={level.tone}
              value={level.value}
            >
              {level.label}
            </PermissionOption>
          ))}
        </PermissionRow>
      ))}
    </PermissionSelector>
  );
}
