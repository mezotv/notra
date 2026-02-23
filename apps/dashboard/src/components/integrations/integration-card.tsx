"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteIntegrationDialog } from "@/components/delete-integration-dialog";
import type {
  DeleteIntegrationResponse,
  IntegrationWithAffectedSchedules,
} from "@/schemas/integrations";
import type { IntegrationCardProps } from "@/types/integrations";
import { QUERY_KEYS } from "@/utils/query-keys";

export function IntegrationCard({
  integration,
  organizationId,
  organizationSlug,
  onUpdate,
}: IntegrationCardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch affected schedules when delete dialog opens
  const { data: affectedSchedulesData, isLoading: isLoadingSchedules } =
    useQuery<IntegrationWithAffectedSchedules>({
      queryKey: [
        "integration-affected-schedules",
        organizationId,
        integration.id,
      ],
      queryFn: async () => {
        const response = await fetch(
          `/api/organizations/${organizationId}/integrations/${integration.id}?checkSchedules=true`
        );
        if (!response.ok) {
          throw new Error("Failed to check affected schedules");
        }
        return response.json();
      },
      enabled: isDeleteDialogOpen,
    });

  const affectedSchedules = affectedSchedulesData?.affectedSchedules ?? [];

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/integrations/${integration.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update integration");
      }

      return response.json();
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.INTEGRATIONS.base,
      });
      toast.success(enabled ? "Integration enabled" : "Integration disabled");
      onUpdate?.();
    },
    onError: () => {
      toast.error("Failed to update integration");
    },
  });

  const deleteMutation = useMutation<DeleteIntegrationResponse, Error, void>({
    mutationFn: async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}/integrations/${integration.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete integration");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.INTEGRATIONS.base,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.AUTOMATION.base,
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
    const destination = `/${organizationSlug}/integrations/github/${integration.id}`;
    queryClient.setQueryData(
      QUERY_KEYS.INTEGRATIONS.detail(organizationId, integration.id),
      integration
    );
    router.prefetch(destination);
    router.push(destination);
  };

  return (
    <>
      <Card
        className="cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleCardClick}
      >
        <CardHeader>
          <CardTitle>{integration.displayName}</CardTitle>
          <CardDescription>
            {integration.createdByUser ? (
              <>
                Added by {integration.createdByUser.name} on{" "}
                {new Date(integration.createdAt).toLocaleDateString()}
              </>
            ) : (
              <>
                Created on{" "}
                {new Date(integration.createdAt).toLocaleDateString()}
              </>
            )}
          </CardDescription>
          <CardAction>
            {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: Event propagation barrier */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Event propagation barrier */}
            <div
              className="flex items-center gap-2"
              data-no-card-click
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              role="presentation"
              tabIndex={-1}
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
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            {integration.repositories.length === 0 ? (
              <p>No repositories configured</p>
            ) : (
              <p>
                {integration.repositories.length} repository
                {integration.repositories.length !== 1 ? "ies" : ""} configured
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <DeleteIntegrationDialog
        affectedSchedules={affectedSchedules}
        integrationName={integration.displayName}
        isDeleting={deleteMutation.isPending}
        isLoadingSchedules={isLoadingSchedules}
        onConfirm={handleDelete}
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      />
    </>
  );
}
