"use client";

import { Logout02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Organization,
  useOrganizationsContext,
} from "@/components/providers/organization-provider";
import { OrganizationMembershipActionDialog } from "@/components/settings/organization-membership-action-dialog";
import { authClient } from "@/lib/auth/client";
import {
  getOrganizationMembershipAction,
  getOrganizationMembershipActionLabel,
} from "@/lib/organizations/membership-action";
import { setLastVisitedOrganization } from "@/utils/cookies";
import { QUERY_KEYS } from "@/utils/query-keys";

export function OrganizationsSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organizations, activeOrganization, isLoading } =
    useOrganizationsContext();

  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [isProcessingOrgAction, setIsProcessingOrgAction] = useState<
    string | null
  >(null);

  const { data: ownedOrganizations = [] } = useQuery({
    queryKey: ["owned-organizations"],
    queryFn: async () => {
      const response = await fetch("/api/user/organizations");
      if (!response.ok) {
        throw new Error("Failed to fetch owned organizations");
      }
      const data = await response.json();
      return (data.ownedOrganizations ?? []) as {
        id: string;
        memberCount: number;
      }[];
    },
  });

  const ownedOrganizationsById = new Map(
    ownedOrganizations.map((org) => [org.id, org])
  );

  async function switchOrganization(org: Organization) {
    if (org.slug === activeOrganization?.slug) {
      return;
    }

    setIsSwitching(org.id);

    try {
      const { error } = await authClient.organization.setActive({
        organizationId: org.id,
      });

      if (error) {
        toast.error(error.message || "Failed to switch organization");
        return;
      }

      await setLastVisitedOrganization(org.slug);

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.AUTH.activeOrganization,
      });

      router.push(`/${org.slug}/settings/account`);
    } catch (error) {
      toast.error("Failed to switch organization");
      console.error(error);
    } finally {
      setIsSwitching(null);
    }
  }

  async function removeOrganization(
    org: Organization,
    action: "leave" | "delete"
  ) {
    setIsProcessingOrgAction(org.id);

    try {
      const response = await fetch("/api/user/organizations/membership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: org.id,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update organization membership");
        return;
      }

      if (action === "delete") {
        toast.success(`Deleted ${org.name}`);
      } else {
        toast.success(`Left ${org.name}`);
      }

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.AUTH.organizations,
      });
      await queryClient.invalidateQueries({
        queryKey: ["owned-organizations"],
      });

      const freshOrgs = await queryClient.fetchQuery({
        queryKey: QUERY_KEYS.AUTH.organizations,
        queryFn: async () => {
          const result = await authClient.organization.list();
          return result.data ?? [];
        },
      });

      if (activeOrganization?.id === org.id) {
        const firstOrg = freshOrgs[0];
        if (firstOrg) {
          await authClient.organization.setActive({
            organizationId: firstOrg.id,
          });
          await setLastVisitedOrganization(firstOrg.slug);
          await queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.AUTH.activeOrganization,
          });
          router.push(`/${firstOrg.slug}/settings/account`);
        }
      }
    } catch (error) {
      toast.error("Failed to update organization membership");
      console.error(error);
    } finally {
      setIsProcessingOrgAction(null);
    }
  }

  if (isLoading) {
    return (
      <TitleCard className="lg:col-span-2" heading="Organizations">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              className="flex items-center justify-between rounded-lg border p-4"
              key={i}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </TitleCard>
    );
  }

  return (
    <TitleCard className="lg:col-span-2" heading="Organizations">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Organizations you are a member of
        </p>

        <div className="space-y-3">
          {organizations.map((org) => {
            const isActive = activeOrganization?.id === org.id;
            const ownedOrg = ownedOrganizationsById.get(org.id);
            const isOwnedByCurrentUser = !!ownedOrg;
            const hasOtherMembers = (ownedOrg?.memberCount ?? 0) > 1;
            const action =
              getOrganizationMembershipAction(isOwnedByCurrentUser);
            const actionLabel = getOrganizationMembershipActionLabel(action);

            return (
              <div
                className="flex items-center justify-between rounded-lg border p-4"
                key={org.id}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 rounded-lg after:rounded-lg">
                    <AvatarImage
                      alt={org.name}
                      className="rounded-lg"
                      src={org.logo ?? undefined}
                    />
                    <AvatarFallback className="rounded-lg">
                      {org.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{org.name}</p>
                      {isActive && (
                        <Badge
                          className="bg-emerald-500/15 px-1.5 py-0 font-semibold text-[10px] text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400"
                          variant="secondary"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">{org.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isActive && (
                    <Button
                      disabled={isSwitching === org.id}
                      onClick={() => switchOrganization(org)}
                      size="sm"
                      variant="outline"
                    >
                      {isSwitching === org.id ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <>
                          <HugeiconsIcon icon={ViewIcon} size={16} />
                          View
                        </>
                      )}
                    </Button>
                  )}

                  {!isActive && organizations.length > 1 && (
                    <OrganizationMembershipActionDialog
                      action={action}
                      hasOtherMembers={hasOtherMembers}
                      onConfirm={() => removeOrganization(org, action)}
                      organizationName={org.name}
                      trigger={
                        <Button
                          disabled={isProcessingOrgAction === org.id}
                          size="sm"
                          variant="destructive"
                        >
                          {isProcessingOrgAction === org.id ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <>
                              <HugeiconsIcon icon={Logout02Icon} size={16} />
                              {actionLabel}
                            </>
                          )}
                        </Button>
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {organizations.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground text-sm">
              You are not a member of any organizations
            </p>
          </div>
        )}
      </div>
    </TitleCard>
  );
}
