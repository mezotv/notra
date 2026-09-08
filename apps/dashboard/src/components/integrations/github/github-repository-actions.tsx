"use client";

import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { DeleteIntegrationDialog } from "@/components/delete-integration-dialog";
import { EditIntegrationDialog } from "@/components/integrations/edit-integration-dialog";
import { LegacyEditTokenDialog } from "@/components/integrations/legacy/edit-token-dialog";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  GitHubRepositoryActionsProps,
  GitHubRepositoryDialog,
} from "@/types/integrations/github";

export function GitHubRepositoryActions({
  onMigrate,
  isMigrating,
  onToggleWebhooks,
  webhooksOpen,
  integration,
  organizationId,
  onManageRepositories,
}: GitHubRepositoryActionsProps) {
  const queryClient = useQueryClient();
  const isEnabled =
    integration.enabled &&
    integration.repositories.every((repository) => repository.enabled);
  const [dialog, setDialog] = useState<GitHubRepositoryDialog>(null);
  const affectedSchedules = useQuery({
    ...dashboardOrpc.integrations.affectedSchedules.queryOptions({
      input: { organizationId, integrationId: integration.id },
    }),
    enabled: dialog === "delete",
  });
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.integrations.key(),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.github.app.get.queryKey({
          input: { organizationId },
        }),
      }),
    ]);
  const toggle = useMutation({
    mutationFn: async () => {
      if (!isEnabled) {
        await Promise.all(
          integration.repositories
            .filter((repository) => !repository.enabled)
            .map((repository) =>
              dashboardOrpc.integrations.repositories.update.call({
                organizationId,
                repositoryId: repository.id,
                enabled: true,
              })
            )
        );
      }
      return dashboardOrpc.integrations.update.call({
        organizationId,
        integrationId: integration.id,
        enabled: !isEnabled,
      });
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(isEnabled ? "Repository paused" : "Repository enabled");
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: () =>
      dashboardOrpc.integrations.delete.call({
        organizationId,
        integrationId: integration.id,
      }),
    onSuccess: async () => {
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.automation.key(),
        }),
      ]);
      setDialog(null);
      toast.success("Repository removed");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={`Manage ${integration.displayName}`}
              disabled={toggle.isPending || remove.isPending}
              size="icon-sm"
              variant="ghost"
            />
          }
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!integration.managedByGitHubApp ? (
            <>
              <DropdownMenuItem onClick={() => setDialog("edit")}>
                Edit repository
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialog("token")}>
                Update access token
              </DropdownMenuItem>
            </>
          ) : null}
          {integration.managedByGitHubApp ? (
            <DropdownMenuItem onClick={onManageRepositories}>
              Manage selection
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => toggle.mutate()}>
              {isEnabled ? "Pause repository" : "Enable repository"}
            </DropdownMenuItem>
          )}
          {!integration.managedByGitHubApp ? (
            <>
              <DropdownMenuItem disabled={isMigrating} onClick={onMigrate}>
                {isMigrating ? "Switching…" : "Switch to GitHub App"}
              </DropdownMenuItem>
              {integration.repositories.length > 0 ? (
                <DropdownMenuItem onClick={onToggleWebhooks}>
                  {webhooksOpen ? "Hide webhooks" : "Webhook settings"}
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}
          <DropdownMenuItem
            onClick={() => setDialog("delete")}
            variant="destructive"
          >
            Remove repository
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {dialog === "edit" ? (
        <EditIntegrationDialog
          integration={integration}
          organizationId={organizationId}
          open
          onOpenChange={(open) => {
            if (!open) {
              setDialog(null);
            }
          }}
        />
      ) : null}
      {dialog === "token" ? (
        <LegacyEditTokenDialog
          integration={integration}
          organizationId={organizationId}
          open
          onOpenChange={(open) => {
            if (!open) {
              setDialog(null);
            }
          }}
        />
      ) : null}
      <DeleteIntegrationDialog
        affectedSchedules={affectedSchedules.data?.affectedSchedules ?? []}
        integrationName={integration.displayName}
        isDeleting={remove.isPending}
        isLoadingSchedules={affectedSchedules.isLoading}
        onConfirm={() => remove.mutate()}
        open={dialog === "delete"}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
      />
    </>
  );
}
