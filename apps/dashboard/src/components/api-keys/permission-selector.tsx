"use client";

import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@notra/ui/components/ui/alert";
import {
  PermissionOption,
  PermissionRow,
  PermissionSelector,
} from "@notra/ui/components/ui/permission-selector";

import { API_KEY_ACCESS_MODE_OPTIONS } from "@/constants/api-keys";
import {
  API_KEY_SCOPE_GROUPS,
  applyScopeLevel,
  deriveScopeLevel,
  getApiKeyAccessMode,
  getApiKeyScopesForAccessMode,
  sortApiKeyScopes,
} from "@/lib/api-keys/scopes";
import type {
  ApiKeyAccessMode,
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
  const accessMode = getApiKeyAccessMode(value);
  const selectedMode = API_KEY_ACCESS_MODE_OPTIONS.find(
    (option) => option.value === accessMode
  );

  const handleLevelChange = (group: ApiKeyScopeGroup, levelValue: string) => {
    onValueChange(
      sortApiKeyScopes([...applyScopeLevel(selected, group, levelValue)])
    );
  };

  return (
    <div className="space-y-3">
      <PermissionRow
        className="w-full"
        disabled={disabled}
        indicatorMotion="smooth"
        label="API key access"
        layout="compact"
        onValueChange={(mode) =>
          onValueChange(
            getApiKeyScopesForAccessMode(mode as ApiKeyAccessMode, value)
          )
        }
        value={accessMode}
      >
        {API_KEY_ACCESS_MODE_OPTIONS.map((option) => (
          <PermissionOption
            className="flex-1 text-xs"
            key={option.value}
            value={option.value}
          >
            {option.label}
          </PermissionOption>
        ))}
      </PermissionRow>

      {accessMode !== "restricted" && selectedMode ? (
        <Alert className="grid-cols-[auto_1fr] gap-x-3 rounded-xl border-blue-500/25 bg-blue-500/8 p-4 text-blue-500 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-400">
          <HugeiconsIcon
            className="mt-0.5 size-5"
            icon={InformationCircleIcon}
          />
          <AlertTitle className="text-sm font-medium">
            {selectedMode.title}
          </AlertTitle>
          <AlertDescription className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {selectedMode.description}
          </AlertDescription>
        </Alert>
      ) : null}

      {accessMode === "restricted" ? (
        <div>
          <p className="text-sm font-medium">Resource access</p>
          <p className="text-muted-foreground text-xs">
            {API_KEY_ACCESS_MODE_OPTIONS[2].description}
          </p>
          <div className="mt-3">
            <PermissionSelector
              className={className}
              label="API key permissions"
            >
              {API_KEY_SCOPE_GROUPS.map((group) => (
                <PermissionRow
                  description={group.description}
                  disabled={disabled}
                  key={group.id}
                  label={group.label}
                  onValueChange={(levelValue) =>
                    handleLevelChange(group, levelValue)
                  }
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
