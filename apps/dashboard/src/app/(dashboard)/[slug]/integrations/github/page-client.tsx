"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
import { GITHUB_CALLBACK_ERROR_MESSAGES } from "@/constants/github";
import {
  hasAttemptedGitHubReauthorization,
  markGitHubReauthorizationAttempted,
  reauthorizeGitHub,
  startGitHubInstall,
} from "@/lib/integrations/github/install";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { GitHubIntegration } from "@/types/integrations";
import {
  GitHubIntegrationSkeleton,
  GitHubLegacyIntegrationsSkeleton,
} from "./skeleton";

interface PageClientProps {
  organizationSlug: string;
}

function useGitHubCallbackErrorToast(errorCode: string | null) {
  const handledErrorRef = useRef(false);

  useEffect(() => {
    if (!errorCode || handledErrorRef.current) {
      return;
    }

    handledErrorRef.current = true;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("githubError");
    window.history.replaceState(null, "", nextUrl);

    toast.error(
      GITHUB_CALLBACK_ERROR_MESSAGES[errorCode] ??
        GITHUB_CALLBACK_ERROR_MESSAGES.github_callback_failed
    );
  }, [errorCode]);
}

function useResumeGitHubInstall(params: {
  callbackPath: string;
  organizationId: string;
  reauthorizationInstallationId: string | null;
  reauthorizationState: string | null;
  shouldResume: boolean;
}) {
  const resumedInstallRef = useRef(false);

  useEffect(() => {
    if (
      (!params.shouldResume &&
        !(
          params.reauthorizationInstallationId && params.reauthorizationState
        )) ||
      !params.organizationId ||
      resumedInstallRef.current
    ) {
      return;
    }

    resumedInstallRef.current = true;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("githubAccountConnected");
    nextUrl.searchParams.delete("githubReauthorizeInstallationId");
    nextUrl.searchParams.delete("githubReauthorizeState");
    window.history.replaceState(null, "", nextUrl);

    if (params.reauthorizationInstallationId && params.reauthorizationState) {
      if (hasAttemptedGitHubReauthorization(params.reauthorizationState)) {
        toast.error("Failed to reconnect GitHub. Please try again.");
        return;
      }
      markGitHubReauthorizationAttempted(params.reauthorizationState);

      const callbackUrl = new URL(
        "/api/integrations/github/callback",
        window.location.origin
      );
      callbackUrl.searchParams.set(
        "installation_id",
        params.reauthorizationInstallationId
      );
      callbackUrl.searchParams.set("state", params.reauthorizationState);

      reauthorizeGitHub(`${callbackUrl.pathname}${callbackUrl.search}`).then(
        (started) => {
          if (!started) {
            toast.error("Failed to reconnect GitHub");
          }
        }
      );
      return;
    }

    startGitHubInstall({
      organizationId: params.organizationId,
      callbackPath: params.callbackPath,
      allowAccountConnection: false,
    }).then((result) => {
      if (result.started) {
        return;
      }
      toast.error(
        result.reason === "account-connection-incomplete"
          ? "GitHub account connection didn't complete. Please try connecting again."
          : "Failed to resume GitHub installation"
      );
    });
  }, [
    params.callbackPath,
    params.organizationId,
    params.reauthorizationInstallationId,
    params.reauthorizationState,
    params.shouldResume,
  ]);
}

function LegacyGitHubIntegrationsSection({
  integrations,
  isLoading,
  onUpdate,
  organizationId,
  organizationSlug,
}: {
  integrations: GitHubIntegration[];
  isLoading: boolean;
  onUpdate: () => void;
  organizationId: string;
  organizationSlug: string;
}) {
  if (isLoading) {
    return <GitHubLegacyIntegrationsSkeleton />;
  }

  if (integrations.length === 0) {
    return null;
  }

  return (
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
        {integrations.map((integration) => (
          <IntegrationCard
            integration={integration}
            key={integration.id}
            onUpdate={onUpdate}
            organizationId={organizationId}
            organizationSlug={organizationSlug}
          />
        ))}
      </div>
    </section>
  );
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const { getOrganization, isLoading: isLoadingOrganizations } =
    useOrganizationsContext();
  const organization = getOrganization(organizationSlug);
  const organizationId = organization?.id ?? "";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [connectOpen, setConnectOpen] = useState(false);
  const [reposOpen, setReposOpen] = useState(
    () => searchParams.get("githubConnected") === "true"
  );
  const [legacyOpen, setLegacyOpen] = useState(false);
  useResumeGitHubInstall({
    callbackPath: pathname,
    organizationId,
    reauthorizationInstallationId: searchParams.get(
      "githubReauthorizeInstallationId"
    ),
    reauthorizationState: searchParams.get("githubReauthorizeState"),
    shouldResume: searchParams.get("githubAccountConnected") === "true",
  });
  useGitHubCallbackErrorToast(searchParams.get("githubError"));

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
    legacyQuery.data?.integrations.filter(
      (integration) =>
        integration.type === "github" &&
        integration.connectionMethod === "personal-access-token"
    ) ?? [];
  const data = githubAppQuery.data;
  const isConnected = Boolean(data?.account);
  const isLoading =
    isLoadingOrganizations ||
    (!!organizationId && githubAppQuery.isLoading && !data);
  const isLoadingLegacyIntegrations =
    isLoadingOrganizations ||
    (!!organizationId && legacyQuery.isLoading && !legacyQuery.data);
  const selectedRepositoryIds = data?.selectedRepositoryIds ?? [];
  const repositories = data?.repositories ? [...data.repositories] : [];

  useEffect(() => {
    if (searchParams.get("githubConnected") !== "true" || !organization?.id) {
      return;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("githubConnected");
    window.history.replaceState(null, "", nextUrl);

    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.github.app.get.queryKey({
        input: { organizationId: organization.id },
      }),
    });
  }, [searchParams, organization?.id, queryClient]);

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

  const startInstall = async () => {
    if (!organizationId) {
      return;
    }

    const callbackPath = pathname || `/${organizationSlug}/integrations/github`;
    const result = await startGitHubInstall({ organizationId, callbackPath });

    if (!result.started) {
      toast.error("Failed to start GitHub install");
    }
  };

  const handleOpenConnect = () => setConnectOpen(true);

  const handleOpenRepositories = () => setReposOpen(true);

  useHotkey(
    "C",
    () => (isConnected ? handleOpenRepositories() : handleOpenConnect()),
    {
      enabled: !!organizationId,
    }
  );

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
    githubAppContent = <GitHubIntegrationSkeleton />;
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
            onClick={isConnected ? handleOpenRepositories : handleOpenConnect}
          >
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            {isConnected ? "Add repositories" : "Connect GitHub"}
            <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
          </Button>
        </div>

        {githubAppContent}

        <LegacyGitHubIntegrationsSection
          integrations={legacyIntegrations}
          isLoading={isLoadingLegacyIntegrations}
          onUpdate={() => legacyQuery.refetch()}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
        />

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
        onConnect={startInstall}
        onOpenChange={setConnectOpen}
        open={connectOpen}
      />
      <SelectRepositoriesDialog
        accounts={data?.account ? [data.account] : []}
        initialSelected={selectedRepositoryIds}
        isLoading={githubAppQuery.isLoading && !data}
        isSaving={saveRepositoriesMutation.isPending}
        onAddAccount={startInstall}
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
