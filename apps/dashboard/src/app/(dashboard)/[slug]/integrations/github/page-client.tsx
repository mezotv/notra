"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { ConnectGitHubDialog } from "@/components/integrations/github/connect-github-dialog";
import { GitHubAccountCard } from "@/components/integrations/github/github-account-card";
import { SelectRepositoriesDialog } from "@/components/integrations/github/select-repositories-dialog";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { LegacyAddIntegrationDialog } from "@/components/integrations/legacy/add-integration-dialog";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  GITHUB_INSTALL_CHANNEL,
  GITHUB_INSTALL_MESSAGE,
} from "@/constants/github";
import { startGitHubInstall } from "@/lib/integrations/github/install";
import { dashboardOrpc } from "@/lib/orpc/query";

interface PageClientProps {
  organizationSlug: string;
}

interface GitHubInstallMessage {
  type: typeof GITHUB_INSTALL_MESSAGE;
  organizationId: string;
}

function isGitHubInstallMessage(
  value: unknown,
  organizationId: string
): value is GitHubInstallMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "type" in value &&
    value.type === GITHUB_INSTALL_MESSAGE &&
    "organizationId" in value &&
    value.organizationId === organizationId
  );
}

function getGitHubInstallStorageKey(organizationId: string) {
  return `${GITHUB_INSTALL_CHANNEL}:${organizationId}`;
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const { getOrganization } = useOrganizationsContext();
  const organization = getOrganization(organizationSlug);
  const organizationId = organization?.id ?? "";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [connectOpen, setConnectOpen] = useState(false);
  const [reposOpen, setReposOpen] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);

  const githubAppQuery = useQuery(
    dashboardOrpc.github.app.get.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
      staleTime: 5 * 60 * 1000,
      refetchOnMount: false,
    })
  );
  const legacyQuery = useQuery(
    dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );
  const legacyIntegrations =
    legacyQuery.data?.integrations.filter((i) => i.type === "github") ?? [];
  const data = githubAppQuery.data;
  const isConnected = Boolean(data?.account);
  const isLoading = !!organizationId && githubAppQuery.isLoading && !data;
  const selectedRepositoryIds = data?.selectedRepositoryIds ?? [];
  const repositories = data?.repositories ? [...data.repositories] : [];

  const handleGitHubInstalled = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.github.app.get.queryKey({
        input: { organizationId },
      }),
    });
    setConnectOpen(false);
    setReposOpen(true);
  }, [organizationId, queryClient]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        isGitHubInstallMessage(event.data, organizationId)
      ) {
        handleGitHubInstalled();
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === getGitHubInstallStorageKey(organizationId)) {
        handleGitHubInstalled();
      }
    };
    const channel = new BroadcastChannel(GITHUB_INSTALL_CHANNEL);
    const handleChannelMessage = (event: MessageEvent) => {
      if (isGitHubInstallMessage(event.data, organizationId)) {
        handleGitHubInstalled();
      }
    };
    channel.addEventListener("message", handleChannelMessage);

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);
    return () => {
      channel.removeEventListener("message", handleChannelMessage);
      channel.close();
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
    };
  }, [handleGitHubInstalled, organizationId]);

  useEffect(() => {
    if (searchParams.get("githubConnected") !== "true" || !organizationId) {
      return;
    }

    const message: GitHubInstallMessage = {
      type: GITHUB_INSTALL_MESSAGE,
      organizationId,
    };

    if (window.opener && window.opener !== window) {
      window.opener.postMessage(message, window.location.origin);
      window.close();
      return;
    }

    const channel = new BroadcastChannel(GITHUB_INSTALL_CHANNEL);
    channel.postMessage(message);
    channel.close();
    window.localStorage.setItem(
      getGitHubInstallStorageKey(organizationId),
      crypto.randomUUID()
    );
    handleGitHubInstalled();
  }, [searchParams, organizationId, handleGitHubInstalled]);

  useHotkey(
    "C",
    () => (isConnected ? handleAddAccount() : handleOpenConnect()),
    {
      enabled: !!organizationId,
    }
  );

  const saveRepositoriesMutation = useMutation({
    mutationFn: async (repositoryIds: string[]) => {
      return dashboardOrpc.github.app.saveRepositories.call({
        organizationId,
        repositoryIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.github.app.get.queryKey({
          input: { organizationId },
        }),
      });
      setReposOpen(false);
      toast.success("GitHub repositories saved");
    },
    onError: () => {
      toast.error("Failed to save GitHub repositories");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return dashboardOrpc.github.app.disconnect.call({ organizationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.github.app.get.queryKey({
          input: { organizationId },
        }),
      });
      toast.success("GitHub disconnected");
    },
    onError: () => {
      toast.error("Failed to disconnect GitHub");
    },
  });

  const openInstallTab = async () => {
    if (!organizationId) {
      return;
    }

    const callbackPath = pathname || `/${organizationSlug}/integrations/github`;
    const didStart = await startGitHubInstall({ organizationId, callbackPath });

    if (!didStart) {
      toast.error("Failed to start GitHub install");
    }
  };

  const handleOpenConnect = () => setConnectOpen(true);

  const handleConnect = openInstallTab;

  const handleAddAccount = openInstallTab;

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const handleSaveRepositories = (repositoryIds: string[]) => {
    saveRepositoriesMutation.mutate(repositoryIds);
  };

  let githubAppContent = (
    <EmptyState
      description="Install the Notra GitHub App to get started."
      title="No GitHub account connected"
    />
  );

  if (isLoading) {
    githubAppContent = (
      <EmptyState
        description="Loading your GitHub App installation."
        title="Loading GitHub"
      />
    );
  } else if (isConnected && data?.account) {
    githubAppContent = (
      <GitHubAccountCard
        account={data.account}
        onAddRepositories={() => setReposOpen(true)}
        onDisconnect={handleDisconnect}
        repositories={repositories}
        selectedRepositoryIds={selectedRepositoryIds}
      />
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">GitHub</h1>
            <p className="text-muted-foreground">
              Connect your repositories through the Notra GitHub App to generate
              changelogs, blog posts, and more.
            </p>
          </div>
          <Button
            className="gap-1.5"
            onClick={isConnected ? handleAddAccount : handleOpenConnect}
          >
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            {isConnected ? "Add GitHub account" : "Connect GitHub"}
            <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
          </Button>
        </div>

        {githubAppContent}

        {legacyIntegrations.length > 0 ? (
          <section className="space-y-3">
            <div className="space-y-0.5">
              <h2 className="font-semibold text-lg">
                Personal access token (Legacy)
              </h2>
              <p className="text-muted-foreground text-sm">
                Legacy integrations connected with a personal access token.
              </p>
            </div>
            <div className="grid gap-4">
              {legacyIntegrations.map((integration) => (
                <IntegrationCard
                  integration={integration}
                  key={integration.id}
                  onUpdate={() => legacyQuery.refetch()}
                  organizationId={organizationId}
                  organizationSlug={organizationSlug}
                />
              ))}
            </div>
          </section>
        ) : null}

        <p className="text-muted-foreground text-xs">
          Still using a personal access token?{" "}
          <button
            className="cursor-pointer font-medium text-foreground underline-offset-4 hover:underline"
            onClick={() => setLegacyOpen(true)}
            type="button"
          >
            Use the legacy flow
          </button>
          .
        </p>
      </div>

      <ConnectGitHubDialog
        isConnecting={false}
        onConnect={handleConnect}
        onOpenChange={setConnectOpen}
        open={connectOpen}
      />
      <SelectRepositoriesDialog
        accounts={data?.account ? [data.account] : []}
        initialSelected={selectedRepositoryIds}
        isLoading={githubAppQuery.isLoading && !data}
        isSaving={saveRepositoriesMutation.isPending}
        onAddAccount={handleAddAccount}
        onOpenChange={setReposOpen}
        onSave={handleSaveRepositories}
        open={reposOpen}
        repositories={repositories}
        selectedAccountId={data?.account?.id}
      />
      <LegacyAddIntegrationDialog
        onOpenChange={setLegacyOpen}
        onSuccess={() => legacyQuery.refetch()}
        open={legacyOpen}
        organizationId={organizationId}
        organizationSlug={organizationSlug}
      />
    </PageContainer>
  );
}
