"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { ConnectGitHubDialog } from "@/components/integrations/github/connect-github-dialog";
import { GitHubAccountCard } from "@/components/integrations/github/github-account-card";
import { GitHubRepositoryPreview } from "@/components/integrations/github/github-repository-preview";
import { GitHubRepositoryRow } from "@/components/integrations/github/github-repository-row";
import { SelectRepositoriesDialog } from "@/components/integrations/github/select-repositories-dialog";
import { LegacyAddIntegrationDialog } from "@/components/integrations/legacy/add-integration-dialog";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { GITHUB_CALLBACK_ERROR_MESSAGES } from "@/constants/github";
import { useGitHubRepositorySelection } from "@/hooks/use-github-repository-selection";
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
  GitHubRepositoriesSkeleton,
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

  const {
    query: githubAppQuery,
    accounts,
    accountId: dialogAccountId,
    setSelectedAccountId: setSelectedDialogAccountId,
    dialogRepositories,
    repositories,
    selectedRepositoryIds,
    saveMutation: saveRepositoriesMutation,
  } = useGitHubRepositorySelection({
    organizationId,
    refetchOnMount: false,
    initialAccountId: searchParams.get("githubAccountId"),
    onSaved: () => setReposOpen(false),
  });
  const legacyQuery = useQuery(
    dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );
  const githubIntegrations =
    legacyQuery.data?.integrations.filter((i) => i.type === "github") ?? [];
  const data = githubAppQuery.data;
  const isConnected = accounts.length > 0;
  const isLoading =
    isLoadingOrganizations ||
    (!!organizationId && githubAppQuery.isLoading && !data);
  const isLoadingLegacyIntegrations =
    isLoadingOrganizations ||
    (!!organizationId && legacyQuery.isLoading && !legacyQuery.data);

  useEffect(() => {
    if (searchParams.get("githubConnected") !== "true" || !organization?.id) {
      return;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("githubConnected");
    nextUrl.searchParams.delete("githubAccountId");
    window.history.replaceState(null, "", nextUrl);

    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.github.app.get.queryKey({
        input: { organizationId: organization.id },
      }),
    });
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.integrations.key(),
    });
  }, [searchParams, organization?.id, queryClient]);

  const migrationMutation = useMutation({
    mutationFn: async (integration: GitHubIntegration) => {
      const app = await githubAppQuery.refetch();
      if (app.error || !app.data) {
        throw new Error("Unable to load GitHub repositories. Try again.");
      }
      const availableRepositories = app.data.repositories;
      const repositoryIds = integration.repositories.map(
        (legacyRepository) =>
          availableRepositories.find(
            (repository) =>
              repository.owner.toLowerCase() ===
                legacyRepository.owner.toLowerCase() &&
              repository.name.toLowerCase() ===
                legacyRepository.repo.toLowerCase()
          )?.id
      );
      if (repositoryIds.length === 0) {
        throw new Error(
          "Configure a repository before switching to the GitHub App."
        );
      }
      if (repositoryIds.some((id) => !id)) {
        toast.info(
          "Allow the Notra GitHub App to access this repository, then return here and switch again."
        );
        await startInstall();
        return false;
      }
      await dashboardOrpc.github.app.saveRepositories.call({
        organizationId,
        repositoryIds: repositoryIds.filter((id): id is string => Boolean(id)),
        preserveExisting: true,
      });
      return true;
    },
    onSuccess: async (migrated) => {
      if (!migrated) {
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.github.app.get.queryKey({
            input: { organizationId },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.integrations.key(),
        }),
      ]);
      toast.success(
        "Switched to GitHub App. Your repository settings were kept."
      );
    },
    onError: () => {
      toast.error(
        "Unable to switch to the GitHub App. Refresh the page and try again."
      );
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return dashboardOrpc.github.app.disconnect.call({
        organizationId,
        accountId,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.github.app.get.queryKey({
            input: { organizationId },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.integrations.key(),
        }),
      ]);
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

  const handleOpenRepositories = (accountId?: string) => {
    setSelectedDialogAccountId(accountId ?? null);
    setReposOpen(true);
  };

  useHotkey(
    "C",
    () => (isConnected ? handleOpenRepositories() : handleOpenConnect()),
    {
      enabled: !!organizationId,
    }
  );

  const handleSaveRepositories = (repositoryIds: string[]) => {
    saveRepositoriesMutation.mutate(repositoryIds);
  };

  let githubAppContent: ReactNode = null;

  if (isLoading) {
    githubAppContent = <GitHubIntegrationSkeleton />;
  } else if (githubAppQuery.isError && !data) {
    githubAppContent = (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 border-b pb-5"
      >
        <p className="text-sm">Unable to load GitHub accounts.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => githubAppQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  } else if (isConnected) {
    githubAppContent = (
      <section
        aria-label="Connected GitHub accounts"
        className="bg-muted/40 grid gap-2 rounded-2xl px-5 py-2"
      >
        {accounts.map((account) => (
          <GitHubAccountCard
            account={account}
            key={account.id}
            isDisconnecting={disconnectMutation.isPending}
            onAddRepositories={() => handleOpenRepositories(account.id)}
            onDisconnect={() => disconnectMutation.mutate(account.id)}
            repositories={repositories.filter(
              (repository) =>
                repository.owner.toLowerCase() === account.login.toLowerCase()
            )}
            selectedRepositoryIds={selectedRepositoryIds}
          />
        ))}
      </section>
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-10 px-4 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">GitHub</h1>
            <p className="text-muted-foreground">
              Manage repository access and where Notra publishes draft pull
              requests.
            </p>
          </div>
          {githubIntegrations.length > 0 ? (
            <Button
              className="gap-1.5"
              onClick={
                isConnected ? () => handleOpenRepositories() : handleOpenConnect
              }
            >
              <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
              {isConnected ? "Add repositories" : "Connect GitHub"}
              <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
            </Button>
          ) : null}
        </div>

        <section
          aria-labelledby="github-repositories-heading"
          className={
            githubIntegrations.length > 0
              ? "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-12"
              : ""
          }
        >
          <div
            className={`space-y-1 pb-2 ${!isLoadingLegacyIntegrations && !legacyQuery.isError && githubIntegrations.length === 0 ? "sr-only" : ""}`}
          >
            <h2
              className="text-base font-semibold"
              id="github-repositories-heading"
            >
              Repositories{" "}
              <span className="text-muted-foreground bg-muted ml-1 rounded-md px-1.5 py-0.5 text-xs font-normal tabular-nums">
                {githubIntegrations.length}
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              Choose what each repository publishes and where draft pull
              requests are saved.
            </p>
          </div>
          <div className="min-w-0 space-y-4">
            {isLoadingLegacyIntegrations ? (
              <GitHubRepositoriesSkeleton />
            ) : null}
            {!isLoadingLegacyIntegrations && legacyQuery.isError ? (
              <div role="alert" className="py-6">
                <p className="text-sm">Unable to load repositories.</p>
                <Button
                  className="mt-2"
                  variant="outline"
                  onClick={() => legacyQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : null}
            {!isLoadingLegacyIntegrations && !legacyQuery.isError ? (
              <div className="space-y-4">
                {githubIntegrations.map((integration) => (
                  <GitHubRepositoryRow
                    integration={integration}
                    key={integration.id}
                    organizationId={organizationId}
                    onManageRepositories={() => handleOpenRepositories()}
                    onMigrate={(target) => migrationMutation.mutate(target)}
                    isMigrating={
                      migrationMutation.isPending &&
                      migrationMutation.variables?.id === integration.id
                    }
                  />
                ))}
                {githubIntegrations.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-10 text-center sm:py-14">
                    <GitHubRepositoryPreview />
                    <div className="mt-2 max-w-sm space-y-2">
                      <h3 className="text-lg font-semibold tracking-tight">
                        Connect your first repository
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Add a repository to turn your updates into changelogs
                        and blog posts, delivered as draft pull requests.
                      </p>
                    </div>
                    <Button
                      className="mt-5 gap-1.5"
                      onClick={
                        isConnected
                          ? () => handleOpenRepositories()
                          : handleOpenConnect
                      }
                    >
                      <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
                      {isConnected ? "Add repositories" : "Connect GitHub"}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        {githubAppContent || !isLoadingLegacyIntegrations ? (
          <section
            aria-labelledby="github-app-heading"
            className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-12"
          >
            <div className="space-y-1">
              <h2 id="github-app-heading" className="text-base font-semibold">
                GitHub App
              </h2>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                Manage connected accounts and repository access.
              </p>
            </div>
            <div className="min-w-0 space-y-4">
              {githubAppContent ?? (
                <div className="bg-muted/40 space-y-3 rounded-2xl p-5">
                  <h3 className="text-sm font-medium">
                    Connect the GitHub App
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Add repositories without managing a personal access token.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={handleOpenConnect}>
                      Connect GitHub
                    </Button>
                    <Button variant="ghost" onClick={() => setLegacyOpen(true)}>
                      Connect with access token
                    </Button>
                  </div>
                </div>
              )}
              {isConnected ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={handleOpenConnect}>
                    <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
                    Add GitHub account
                  </Button>
                  <Button variant="ghost" onClick={() => setLegacyOpen(true)}>
                    Connect with access token
                  </Button>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      <ConnectGitHubDialog
        isConnecting={false}
        onConnect={startInstall}
        onOpenChange={setConnectOpen}
        open={connectOpen}
      />
      <SelectRepositoriesDialog
        accounts={accounts}
        initialSelected={selectedRepositoryIds}
        isLoading={githubAppQuery.isPending || githubAppQuery.isFetching}
        error={
          githubAppQuery.isError
            ? "Unable to load repositories from GitHub."
            : undefined
        }
        onRetry={() => githubAppQuery.refetch()}
        isSaving={saveRepositoriesMutation.isPending}
        onAddAccount={startInstall}
        onOpenChange={setReposOpen}
        onSave={handleSaveRepositories}
        onSelectAccount={setSelectedDialogAccountId}
        open={reposOpen}
        repositories={dialogRepositories}
        selectedAccountId={dialogAccountId}
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
