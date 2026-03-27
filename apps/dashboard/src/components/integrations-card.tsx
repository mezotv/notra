"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type React from "react";
import type { MouseEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  AffectedTriggersData,
  DeleteResourceResponse,
} from "@/schemas/integrations";
import { DeleteIntegrationDialog } from "./delete-integration-dialog";

export interface InstalledIntegration {
  id: string;
  displayName: string;
  type: string;
  enabled: boolean;
  createdAt: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export interface InstalledIntegrationCardProps {
  integration: InstalledIntegration;
  organizationId: string;
  organizationSlug: string;
  icon?: React.ReactNode;
  accentColor?: string;
  onUpdate?: () => void;
}

export function InstalledIntegrationCard({
  integration,
  organizationId,
  organizationSlug,
  icon,
  accentColor,
  onUpdate,
}: InstalledIntegrationCardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: affectedSchedulesData, isLoading: isLoadingSchedules } =
    useQuery<AffectedTriggersData>({
      ...dashboardOrpc.integrations.affectedSchedules.queryOptions({
        input: {
          organizationId,
          integrationId: integration.id,
        },
      }),
      enabled: isDeleteDialogOpen,
    });

  const affectedSchedules = affectedSchedulesData?.affectedSchedules ?? [];

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return dashboardOrpc.integrations.update.call({
        organizationId,
        integrationId: integration.id,
        enabled,
      });
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.integrations.key(),
      });
      toast.success(enabled ? "Integration enabled" : "Integration disabled");
      onUpdate?.();
    },
    onError: () => {
      toast.error("Failed to update integration");
    },
  });

  const deleteMutation = useMutation<DeleteResourceResponse, Error, void>({
    mutationFn: async () => {
      return dashboardOrpc.integrations.delete.call({
        organizationId,
        integrationId: integration.id,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.integrations.key(),
      });
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.automation.key(),
      });

      const disabledCount = data.disabledSchedules?.length ?? 0;
      if (disabledCount > 0) {
        toast.success(
          `Integration deleted. ${disabledCount} schedule${disabledCount === 1 ? " was" : "s were"} disabled.`
        );
      } else {
        toast.success("Integration deleted");
      }
      onUpdate?.();
    },
    onError: () => {
      toast.error("Failed to delete integration");
    },
  });

  const handleToggle = () => {
    toggleMutation.mutate(!integration.enabled);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const isLoading = toggleMutation.isPending || deleteMutation.isPending;

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-no-card-click]")) {
      return;
    }
    router.push(
      `/${organizationSlug}/integrations/${integration.type}/${integration.id}`
    );
  };

  return (
    <>
      <DeleteIntegrationDialog
        affectedSchedules={affectedSchedules}
        integrationName={integration.displayName}
        isDeleting={deleteMutation.isPending}
        isLoadingSchedules={isLoadingSchedules}
        onConfirm={handleDelete}
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      />
      <TitleCard
        accentColor={accentColor}
        action={
          <>
            {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: Event propagation barrier */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Event propagation barrier */}
            <div
              className="flex items-center gap-1.5 sm:gap-2"
              data-no-card-click
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Badge variant={integration.enabled ? "default" : "secondary"}>
                {integration.enabled ? "Enabled" : "Disabled"}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button disabled={isLoading} size="icon-sm" variant="ghost">
                      <svg
                        aria-label="More options"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <title>More options</title>
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggle();
                    }}
                  >
                    {integration.enabled ? "Disable" : "Enable"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteClick();
                    }}
                    variant="destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        }
        className="cursor-pointer transition-colors hover:bg-muted/80"
        contentClassName="hidden"
        heading={integration.displayName}
        icon={icon}
        onClick={handleCardClick}
      />
    </>
  );
}
