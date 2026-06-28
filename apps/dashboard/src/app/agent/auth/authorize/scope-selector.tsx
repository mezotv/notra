"use client";

import {
  PermissionOption,
  PermissionRow,
  PermissionSelector,
} from "@notra/ui/components/ui/permission-selector";
import { useQueryState } from "nuqs";
import { OAUTH_GRANT_QUERY_PARAM } from "@/constants/oauth";
import {
  applyScopeLevel,
  deriveScopeLevel,
  serializeScopes,
} from "@/lib/oauth/scopes";
import type { OAuthScopeGroup, OAuthScopeSelectorProps } from "@/types/oauth";

export function OAuthScopeSelector({
  groups,
  defaultGrant,
}: OAuthScopeSelectorProps) {
  const [grant, setGrant] = useQueryState(OAUTH_GRANT_QUERY_PARAM, {
    defaultValue: defaultGrant,
  });

  const selected = new Set(grant.split(" ").filter(Boolean));

  const handleLevelChange = (group: OAuthScopeGroup, levelValue: string) => {
    setGrant(serializeScopes(applyScopeLevel(selected, group, levelValue)));
  };

  return (
    <div className="space-y-2">
      <span className="font-medium text-muted-foreground text-xs">
        Permissions
      </span>
      <input name="scope" type="hidden" value={grant} />
      <PermissionSelector label="Requested permissions">
        {groups.map((group) => (
          <PermissionRow
            description={group.description}
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
    </div>
  );
}
