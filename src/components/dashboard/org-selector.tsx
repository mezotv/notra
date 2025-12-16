"use client";

import { ArrowDown01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { QUERY_KEYS } from "@/utils/query-keys";
import { useOrganizationsContext } from "../providers/organization-provider";

type Organization = NonNullable<
  ReturnType<typeof useOrganizationsContext>["organizations"]
>[number];

function OrganizationItem({
  org,
  isActive,
  isDisabled,
  onSelect,
}: {
  org: Organization;
  isActive: boolean;
  isDisabled: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <DropdownMenuItem
      className="gap-2 p-2"
      disabled={isDisabled}
      onClick={() => onSelect(org.id)}
    >
      <Avatar className="size-6 rounded-sm border">
        <AvatarImage src={org.logo || undefined} />
        <AvatarFallback>{org.name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      {org.name}
      {isActive ? (
        <span className="ml-auto text-muted-foreground text-xs">✓</span>
      ) : null}
    </DropdownMenuItem>
  );
}

function OrganizationTrigger({
  activeOrganization,
  isSwitching,
  isLoading,
}: {
  activeOrganization: NonNullable<
    ReturnType<typeof useOrganizationsContext>["activeOrganization"]
  >;
  isSwitching: boolean;
  isLoading: boolean;
}) {
  return (
    <SidebarMenuButton
      className={cn(
        "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
        isSwitching ? "cursor-not-allowed opacity-70" : ""
      )}
      disabled={isLoading || isSwitching}
      size="lg"
    >
      <Avatar className="size-8">
        <AvatarImage
          className="rounded-[4px]"
          src={activeOrganization.logo || undefined}
        />
        <AvatarFallback className="border bg-sidebar-accent">
          {activeOrganization.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">
          {activeOrganization.name}
        </span>
      </div>
      <HugeiconsIcon className="ml-auto size-4" icon={ArrowDown01Icon} />
    </SidebarMenuButton>
  );
}

function SkeletonTrigger() {
  return (
    <SidebarMenuButton size="lg">
      <Skeleton className="size-8 rounded-lg" />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="ml-auto size-4" />
    </SidebarMenuButton>
  );
}

export function OrgSelector() {
  const queryClient = useQueryClient();
  const { organizations, activeOrganization, isLoading } =
    useOrganizationsContext();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSelectOrganization = async (organizationId: string | null) => {
    const isAlreadySelected =
      organizationId === activeOrganization?.id ||
      (organizationId === null && !activeOrganization);

    if (isAlreadySelected) {
      return;
    }

    setIsSwitching(true);
    setIsCollapsed(true);

    const { error } = await authClient.organization.setActive({
      organizationId,
    });

    if (error) {
      toast.error(error.message || "Failed to switch organization");
      setIsSwitching(false);
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.AUTH.activeOrganization,
    });
    queryClient.invalidateQueries();

    setIsSwitching(false);
    toast.success("Organization updated");
  };

  const { ownedOrganizations, sharedOrganizations } = useMemo(() => {
    const owned =
      organizations?.filter(
        (organization) =>
          "role" in organization && organization.role === "owner"
      ) || [];
    const shared =
      organizations?.filter(
        (organization) =>
          "currentUserRole" in organization &&
          organization.currentUserRole !== "owner"
      ) || [];
    return { ownedOrganizations: owned, sharedOrganizations: shared };
  }, [organizations]);

  const showSkeleton = !activeOrganization && isLoading;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu
          onOpenChange={() => {
            setIsCollapsed(!isCollapsed);
          }}
          open={!isCollapsed}
        >
          <DropdownMenuTrigger
            render={
              activeOrganization !== null && !showSkeleton ? (
                <OrganizationTrigger
                  activeOrganization={activeOrganization}
                  isLoading={isLoading}
                  isSwitching={isSwitching}
                />
              ) : (
                <SkeletonTrigger />
              )
            }
          />
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {ownedOrganizations.length > 0 && (
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Your Organizations
                </DropdownMenuLabel>
                {ownedOrganizations.map((org) => (
                  <OrganizationItem
                    isActive={activeOrganization?.id === org.id}
                    isDisabled={isLoading || isSwitching}
                    key={org.id}
                    onSelect={handleSelectOrganization}
                    org={org}
                  />
                ))}
              </DropdownMenuGroup>
            )}

            {sharedOrganizations.length > 0 && (
              <DropdownMenuGroup>
                {ownedOrganizations.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Shared Organizations
                </DropdownMenuLabel>
                {sharedOrganizations.map((org) => (
                  <OrganizationItem
                    isActive={activeOrganization?.id === org.id}
                    isDisabled={isLoading || isSwitching}
                    key={org.id}
                    onSelect={handleSelectOrganization}
                    org={org}
                  />
                ))}
              </DropdownMenuGroup>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => {
                setIsCollapsed(!isCollapsed);
              }}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
              </div>
              <div className="font-medium text-muted-foreground">
                Create Organization
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* <CreateWorkspaceDialog open={dialogOpen} setOpen={setDialogOpen} /> */}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
