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
  getApiKeyScopesForAccessMode,
  sortApiKeyScopes,
} from "@/lib/api-keys/scopes";
import type {
  ApiKeyAccessMode,
  ApiKeyPermissionSelectorProps,
  ApiKeyScopeGroup,
} from "@/types/api-keys";

export function ApiKeyPermissionSelector({
  accessMode,
  value,
  onAccessModeChange,
  onValueChange,
  disabled,
  className,
}: ApiKeyPermissionSelectorProps) {
  const selected = new Set(value);
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
        indicatorMotion="fade"
        label="API key access"
        layout="compact"
        onValueChange={(mode) => {
          const nextMode = mode as ApiKeyAccessMode;
          onAccessModeChange(
            nextMode,
            getApiKeyScopesForAccessMode(nextMode, value)
          );
        }}
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
        <Alert
          className="border-info/25 bg-info/10 grid-cols-[auto_1fr] gap-x-3 rounded-xl p-4"
          variant="info"
        >
          <HugeiconsIcon
            className="mt-0.5 size-5"
            icon={InformationCircleIcon}
          />
          <AlertTitle className="text-sm font-medium">
            {selectedMode.title}
          </AlertTitle>
          <AlertDescription className="mt-1 text-xs leading-relaxed">
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
