"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { startGitHubInstall } from "@/lib/integrations/github/install";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { GitHubIntegrationDialogProps } from "@/types/integrations/github";

import { ConnectGitHubDialog } from "./connect-github-dialog";
import { SelectRepositoriesDialog } from "./select-repositories-dialog";

export function GitHubIntegrationDialog({
  organizationId,
  organizationSlug,
  open,
  onOpenChange,
}: GitHubIntegrationDialogProps) {
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );

  const githubAppQuery = useQuery(
    dashboardOrpc.github.app.get.queryOptions({
      input: { organizationId },
      enabled: !!organizationId && open,
      staleTime: 5 * 60 * 1000,
    })
  );

  const data = githubAppQuery.data;
  const accounts = data?.accounts ?? [];
  const isConnected = accounts.length > 0;
  const repositories = data?.repositories ? [...data.repositories] : [];
  const selectedRepositoryIds = data?.selectedRepositoryIds ?? [];
  const dialogAccountId = selectedAccountId ?? accounts[0]?.id;
  const dialogAccount = accounts.find(
    (account) => account.id === dialogAccountId
  );
  const dialogRepositories = dialogAccount
    ? repositories.filter(
        (repository) =>
          repository.owner.toLowerCase() === dialogAccount.login.toLowerCase()
      )
    : repositories;

  const invalidateGithubApp = () =>
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.github.app.get.queryKey({
        input: { organizationId },
      }),
    });

  const saveRepositoriesMutation = useMutation({
    mutationFn: (repositoryIds: string[]) =>
      dashboardOrpc.github.app.saveRepositories.call({
        organizationId,
        repositoryIds,
      }),
    onSuccess: () => {
      invalidateGithubApp();
      onOpenChange(false);
      toast.success("GitHub repositories saved");
    },
    onError: () => {
      toast.error("Failed to save GitHub repositories");
    },
  });

  const openInstall = async () => {
    if (!organizationId) {
      return;
    }

    const callbackPath = `/${organizationSlug}/integrations/github`;
    const result = await startGitHubInstall({ organizationId, callbackPath });

    if (!result.started) {
      toast.error("Failed to start GitHub install");
    }
  };

  if (isConnected) {
    return (
      <SelectRepositoriesDialog
        accounts={accounts}
        initialSelected={selectedRepositoryIds}
        isLoading={githubAppQuery.isLoading}
        isSaving={saveRepositoriesMutation.isPending}
        onAddAccount={openInstall}
        onOpenChange={onOpenChange}
        onSave={(repositoryIds) =>
          saveRepositoriesMutation.mutate(repositoryIds)
        }
        onSelectAccount={setSelectedAccountId}
        open={open}
        repositories={dialogRepositories}
        selectedAccountId={dialogAccountId}
      />
    );
  }

  return (
    <ConnectGitHubDialog
      onConnect={openInstall}
      onOpenChange={onOpenChange}
      open={open}
    />
  );
}
