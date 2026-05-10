"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { use, useMemo } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { NotificationRecipients } from "@/components/settings/notification-recipients";
import { NotificationToggleRow } from "@/components/settings/notification-toggle-row";
import { authClient } from "@/lib/auth/client";
import { dashboardOrpc } from "@/lib/orpc/query";
import { NOTIFICATION_TOGGLE_GROUPS } from "@/lib/settings/notification-toggles";
import type { NotificationSettings } from "@/types/settings/notifications";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface MemberRow {
  userId: string;
  role: string;
  user?: { email?: string | null };
}

export default function NotificationsSettingsPage({ params }: PageProps) {
  const { slug } = use(params);
  const queryClient = useQueryClient();
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const organization =
    activeOrganization?.slug === slug
      ? activeOrganization
      : getOrganization(slug);

  const { data: session } = authClient.useSession();

  const { data: membersData, isPending: isLoadingMembers } = useQuery({
    queryKey: ["members", organization?.id],
    queryFn: async () => {
      const { data, error } = await authClient.organization.listMembers({
        query: { organizationId: organization?.id },
      });
      if (error) {
        throw new Error("Failed to fetch members");
      }
      return data;
    },
    enabled: !!organization?.id,
  });

  const members = (membersData?.members ?? []) as MemberRow[];

  const currentMember = members.find((m) => m.userId === session?.user?.id);
  const isOwner = currentMember?.role === "owner";

  const ownerEmails = useMemo(
    () =>
      members
        .filter((m) => m.role === "owner")
        .map((m) => m.user?.email)
        .filter((email): email is string => Boolean(email)),
    [members]
  );

  const { data: settings, isPending: isLoadingSettings } = useQuery({
    ...dashboardOrpc.notifications.get.queryOptions({
      input: { organizationId: organization?.id ?? "" },
      select: (data) => data.settings as NotificationSettings,
    }),
    enabled: !!organization?.id,
  });

  const { mutate: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: async (data: Partial<NotificationSettings>) => {
      return dashboardOrpc.notifications.update.call({
        organizationId: organization?.id ?? "",
        ...data,
      });
    },
    onSuccess: () => {
      toast.success("Notification settings updated");
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.notifications.get.queryKey({
          input: { organizationId: organization?.id ?? "" },
        }),
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update notification settings"
      );
    },
  });

  if (!organization) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full space-y-6 px-4 lg:px-6">
          <div className="space-y-1">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72" />
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </PageContainer>
    );
  }

  const controlsDisabled = !isOwner || isUpdating;

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Configure email notifications for your organization
          </p>
        </div>

        <NotificationRecipients
          emails={ownerEmails}
          isLoading={isLoadingMembers}
        />

        {NOTIFICATION_TOGGLE_GROUPS.map((group) => (
          <TitleCard heading={group.heading} key={group.heading}>
            {isLoadingSettings ? (
              <div className="space-y-2">
                {group.toggles.map((toggle) => (
                  <Skeleton
                    className="h-10 w-full"
                    key={`${group.heading}-${toggle.key}`}
                  />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {group.toggles.map((toggle) => (
                  <NotificationToggleRow
                    checked={settings?.[toggle.key] ?? toggle.defaultValue}
                    config={toggle}
                    disabled={controlsDisabled}
                    key={toggle.key}
                    onCheckedChange={(checked) =>
                      updateSettings({ [toggle.key]: checked })
                    }
                  />
                ))}
              </div>
            )}
          </TitleCard>
        ))}

        {!(isLoadingMembers || isOwner) && (
          <p className="text-muted-foreground text-xs">
            Only the organization owner can manage notification settings.
          </p>
        )}
      </div>
    </PageContainer>
  );
}
