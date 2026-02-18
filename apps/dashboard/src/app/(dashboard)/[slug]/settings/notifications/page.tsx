"use client";

import { Label } from "@notra/ui/components/ui/label";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Switch } from "@notra/ui/components/ui/switch";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { use } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { authClient } from "@/lib/auth/client";
import { QUERY_KEYS } from "@/utils/query-keys";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface NotificationSettings {
  scheduledContentCreation: boolean;
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

  const { data: membersData } = useQuery({
    queryKey: ["members", organization?.id],
    queryFn: async () => {
      const { data, error } = await authClient.organization.listMembers({
        query: { organizationId: organization!.id },
      });
      if (error) {
        throw new Error("Failed to fetch members");
      }
      return data;
    },
    enabled: !!organization?.id,
  });

  const currentMember = membersData?.members?.find(
    (m: { userId: string }) => m.userId === session?.user?.id
  );
  const isOwner = currentMember?.role === "owner";

  const { data: settings, isPending: isLoadingSettings } = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATION_SETTINGS.settings(organization?.id ?? ""),
    queryFn: async () => {
      const response = await fetch(
        `/api/organizations/${organization!.id}/notification-settings`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch notification settings");
      }
      const data = await response.json();
      return data.settings as NotificationSettings;
    },
    enabled: !!organization?.id,
  });

  const { mutate: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: async (data: Partial<NotificationSettings>) => {
      const response = await fetch(
        `/api/organizations/${organization!.id}/notification-settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error ?? "Failed to update notification settings"
        );
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Notification settings updated");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.NOTIFICATION_SETTINGS.settings(
          organization?.id ?? ""
        ),
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
          <Skeleton className="h-64 rounded-[20px]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Configure email notifications for your organization
          </p>
        </div>

        <TitleCard heading="Email Notifications">
          {isLoadingSettings ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="scheduled-content-creation">
                    Scheduled content creation
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Receive an email when scheduled content is created
                  </p>
                </div>
                <Switch
                  checked={settings?.scheduledContentCreation ?? false}
                  disabled={!isOwner || isUpdating}
                  id="scheduled-content-creation"
                  onCheckedChange={(checked) =>
                    updateSettings({ scheduledContentCreation: checked })
                  }
                />
              </div>
              {!isOwner && (
                <p className="text-muted-foreground text-xs">
                  Only the organization owner can manage notification settings.
                </p>
              )}
            </div>
          )}
        </TitleCard>
      </div>
    </PageContainer>
  );
}
