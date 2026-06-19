"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { GITHUB_INSTALL_MESSAGE } from "@/constants/github";
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

  const githubAppQuery = useQuery(
    dashboardOrpc.github.app.get.queryOptions({
      input: { organizationId },
      enabled: !!organizationId && open,
      staleTime: 5 * 60 * 1000,
    })
  );

  const data = githubAppQuery.data;
  const isConnected = Boolean(data?.account);
  const repositories = data?.repositories ? [...data.repositories] : [];
  const selectedRepositoryIds = data?.selectedRepositoryIds ?? [];

  const invalidateGithubApp = () =>
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.github.app.get.queryKey({
        input: { organizationId },
      }),
    });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data === GITHUB_INSTALL_MESSAGE
      ) {
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.github.app.get.queryKey({
            input: { organizationId },
          }),
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [organizationId, queryClient]);

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
    const didStart = await startGitHubInstall({ organizationId, callbackPath });

    if (!didStart) {
      toast.error("Failed to start GitHub install");
    }
  };

  if (isConnected && data?.account) {
    return (
      <SelectRepositoriesDialog
        accounts={[data.account]}
        initialSelected={selectedRepositoryIds}
        isLoading={githubAppQuery.isLoading}
        isSaving={saveRepositoriesMutation.isPending}
        onAddAccount={openInstall}
        onOpenChange={onOpenChange}
        onSave={(repositoryIds) =>
          saveRepositoriesMutation.mutate(repositoryIds)
        }
        open={open}
        repositories={repositories}
        selectedAccountId={data.account.id}
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
