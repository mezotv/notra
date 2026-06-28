"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useState } from "react";
import { OrganizationOptionsList } from "@/components/dashboard/org-selector";
import type { OAuthOrgSelectorProps } from "@/types/oauth";

export function OAuthOrgSelector({
  organizations,
  initialOrganizationId,
}: OAuthOrgSelectorProps) {
  const [selectedId, setSelectedId] = useState(
    initialOrganizationId ?? organizations[0]?.id ?? ""
  );

  const selectedOrganization =
    organizations.find((organization) => organization.id === selectedId) ??
    organizations[0];
  const submittedOrganizationId = selectedOrganization?.id ?? "";

  if (!selectedOrganization) {
    return null;
  }

  const hasMultipleOrganizations = organizations.length > 1;

  return (
    <div className="space-y-2">
      <span className="font-medium text-muted-foreground text-xs">
        Authorize for
      </span>
      <input
        name="organization_id"
        type="hidden"
        value={submittedOrganizationId}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={!hasMultipleOrganizations}
          render={
            <button
              className="flex w-full items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-muted/40 disabled:cursor-default disabled:opacity-100"
              type="button"
            >
              <Avatar className="size-7 rounded-lg after:rounded-lg">
                <AvatarImage
                  className="rounded-lg"
                  src={selectedOrganization.logo || undefined}
                />
                <AvatarFallback className="rounded-lg border bg-muted">
                  {selectedOrganization.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate font-medium text-sm">
                {selectedOrganization.name}
              </span>
              {hasMultipleOrganizations ? (
                <HugeiconsIcon
                  className="size-4 text-muted-foreground"
                  icon={ArrowDown01Icon}
                />
              ) : null}
            </button>
          }
        />
        <DropdownMenuContent
          align="start"
          className="max-w-(--anchor-width) rounded-lg"
        >
          <OrganizationOptionsList
            onSelect={setSelectedId}
            organizations={organizations}
            selectedOrganizationId={selectedId}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
