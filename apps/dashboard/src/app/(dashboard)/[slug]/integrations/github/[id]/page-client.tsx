"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Github } from "@notra/ui/components/ui/svgs/github";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  LoaderIcon,
  RefreshCwIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import type {
  GitHubIntegration,
  GitHubRepository,
  WebhookConfig,
} from "@/types/integrations";
import type { Trigger } from "@/types/triggers/triggers";
import { getOutputTypeLabel } from "@/utils/output-types";
import { QUERY_KEYS } from "@/utils/query-keys";
import { GitHubIntegrationDetailSkeleton } from "./skeleton";

const EditIntegrationDialog = dynamic(
  () =>
    import("@/components/integrations/edit-integration-dialog").then((mod) => ({
      default: mod.EditIntegrationDialog,
    })),
  { ssr: false }
);

interface PageClientProps {
  integrationId: string;
}

interface IntegrationsResponse {
  integrations: Array<GitHubIntegration & { type: string }>;
  count: number;
}

function CopyButton({
  value,
  label,
  className,
  onCopy,
}: {
  value: string;
  label: string;
  className?: string;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      toast.error("Clipboard not supported");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.();
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Button
      className={className}
      onClick={handleCopy}
      size="icon"
      type="button"
      variant="outline"
    >
      {copied ? (
        <CheckIcon className="size-4" />
      ) : (
        <CopyIcon className="size-4" />
      )}
    </Button>
  );
}

function WebhookSection({
  repo,
  organizationId,
}: {
  repo: GitHubRepository;
  organizationId: string;
}) {
  const [secretRevealed, setSecretRevealed] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: webhookConfig,
    isLoading,
    isFetched,
    isError,
  } = useQuery<WebhookConfig | null>({
    queryKey: QUERY_KEYS.INTEGRATIONS.webhookConfig(repo.id),
    queryFn: async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}/repositories/${repo.id}/webhook`
      );
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch webhook config");
      }
      return response.json();
    },
  });

  const secretMutation = useMutation<
    WebhookConfig,
    Error,
    { regenerate: boolean }
  >({
    mutationFn: async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}/repositories/${repo.id}/webhook`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate webhook secret");
      }
      return response.json();
    },
    onSuccess: (_data, { regenerate }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.INTEGRATIONS.webhookConfig(repo.id),
      });
      if (regenerate) {
        setSecretRevealed(false);
        toast.success("Webhook secret regenerated");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const githubSettingsUrl = `https://github.com/${repo.owner}/${repo.repo}/settings/hooks`;

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-lg border p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-5">
        <p className="font-medium text-destructive text-sm">
          Failed to load webhook configuration
        </p>
      </div>
    );
  }

  if (isFetched && !webhookConfig) {
    return (
      <div className="rounded-lg border border-dashed p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium text-sm">Webhook not configured</p>
            <p className="text-muted-foreground text-xs">
              Generate a webhook secret to start receiving events from GitHub.
            </p>
          </div>
          <Button
            disabled={secretMutation.isPending}
            onClick={() => secretMutation.mutate({ regenerate: false })}
            size="sm"
            variant="outline"
          >
            {secretMutation.isPending ? (
              <LoaderIcon className="size-3.5 animate-spin" />
            ) : null}
            Generate Secret
          </Button>
        </div>
      </div>
    );
  }

  if (!webhookConfig) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg border p-5">
      <fieldset className="space-y-1.5">
        <p className="font-medium text-sm">Payload URL</p>
        <div className="flex gap-2">
          <Input
            className="font-mono text-xs"
            readOnly
            value={webhookConfig.webhookUrl}
          />
          <CopyButton label="URL" value={webhookConfig.webhookUrl} />
        </div>
      </fieldset>

      <fieldset className="space-y-1.5">
        <p className="font-medium text-sm">Secret</p>
        <div className="flex gap-2">
          <Input
            className="font-mono text-xs"
            onBlur={() => setSecretRevealed(false)}
            onFocus={() => setSecretRevealed(true)}
            readOnly
            type={secretRevealed ? "text" : "password"}
            value={webhookConfig.webhookSecret}
          />
          <CopyButton
            className="shrink-0"
            label="Secret"
            onCopy={() => {
              setSecretRevealed(true);
              setTimeout(() => setSecretRevealed(false), 2000);
            }}
            value={webhookConfig.webhookSecret}
          />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className="shrink-0"
                  disabled={secretMutation.isPending}
                  onClick={() => secretMutation.mutate({ regenerate: true })}
                  size="icon"
                  type="button"
                  variant="outline"
                />
              }
            >
              {secretMutation.isPending ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="size-4" />
              )}
            </TooltipTrigger>
            <TooltipContent>Regenerate secret</TooltipContent>
          </Tooltip>
        </div>
      </fieldset>

      <p className="text-muted-foreground text-xs">
        Set content type to{" "}
        <span className="rounded bg-muted px-1 py-0.5 font-mono text-[0.6875rem]">
          application/json
        </span>{" "}
        in your{" "}
        <Link
          className="text-primary hover:underline"
          href={githubSettingsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          GitHub Webhook Settings
        </Link>
        .
      </p>
    </div>
  );
}

function formatFrequency(cron?: Trigger["sourceConfig"]["cron"]) {
  if (!cron) {
    return "Not set";
  }
  const time = `${String(cron.hour).padStart(2, "0")}:${String(cron.minute).padStart(2, "0")} UTC`;
  if (cron.frequency === "weekly") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `Weekly - ${days[cron.dayOfWeek ?? 0]} @ ${time}`;
  }
  if (cron.frequency === "monthly") {
    return `Monthly - Day ${cron.dayOfMonth ?? 1} @ ${time}`;
  }
  return `Daily @ ${time}`;
}

function EventsSection({
  organizationId,
  slug,
  repositoryIds,
}: {
  organizationId: string;
  slug: string;
  repositoryIds: string[];
}) {
  const normalizedRepositoryIds = [...repositoryIds].sort();
  const repositoryQueryString = normalizedRepositoryIds
    .map((repositoryId) => `repositoryId=${encodeURIComponent(repositoryId)}`)
    .join("&");
  const hasRepositories = normalizedRepositoryIds.length > 0;

  const { data, isPending, isError } = useQuery<{ triggers: Trigger[] }>({
    queryKey: [
      ...QUERY_KEYS.AUTOMATION.events(organizationId),
      "repositoryIds",
      ...normalizedRepositoryIds,
    ],
    queryFn: async () => {
      const response = await fetch(
        repositoryQueryString
          ? `/api/organizations/${organizationId}/automation/events?${repositoryQueryString}`
          : `/api/organizations/${organizationId}/automation/events`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
    enabled: !!organizationId && hasRepositories,
  });

  const events = data?.triggers ?? [];
  const displayEvents = events.slice(0, 5);
  const isLoadingEvents = isPending && hasRepositories;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-semibold text-lg">Events</h2>
          <p className="text-muted-foreground text-sm">
            React to repository events like releases and pushes.
          </p>
        </div>
        {slug && (
          <Link href={`/${slug}/automation/events`}>
            <Button size="sm" variant="outline">
              View all
              <ArrowRightIcon className="ml-1 size-3.5" />
            </Button>
          </Link>
        )}
      </div>
      {isLoadingEvents ? (
        <Skeleton className="h-18 w-full rounded-lg" />
      ) : isError ? (
        <div className="flex items-center justify-center rounded-lg border border-destructive/50 border-dashed p-8 text-destructive text-sm">
          Failed to load event triggers.
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground text-sm">
          No event triggers configured yet.
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {displayEvents.map((event) => (
            <div
              className="flex items-center justify-between gap-4 px-4 py-3"
              key={event.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="truncate font-medium text-sm">
                  {event.name}
                </span>
                <span className="shrink-0 text-muted-foreground text-xs">
                  {getOutputTypeLabel(event.outputType)}
                </span>
              </div>
              <Badge variant={event.enabled ? "default" : "secondary"}>
                {event.enabled ? "Active" : "Paused"}
              </Badge>
            </div>
          ))}
          {events.length > 5 && (
            <div className="px-4 py-2 text-center">
              <Link
                className="text-muted-foreground text-xs hover:underline"
                href={`/${slug}/automation/events`}
              >
                +{events.length - 5} more event triggers
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SchedulesSection({
  organizationId,
  slug,
  repositoryIds,
}: {
  organizationId: string;
  slug: string;
  repositoryIds: string[];
}) {
  const normalizedRepositoryIds = [...repositoryIds].sort();
  const repositoryQueryString = normalizedRepositoryIds
    .map((repositoryId) => `repositoryId=${encodeURIComponent(repositoryId)}`)
    .join("&");
  const hasRepositories = normalizedRepositoryIds.length > 0;

  const { data, isPending, isError } = useQuery<{ triggers: Trigger[] }>({
    queryKey: [
      ...QUERY_KEYS.AUTOMATION.schedules(organizationId),
      "repositoryIds",
      ...normalizedRepositoryIds,
    ],
    queryFn: async () => {
      const response = await fetch(
        repositoryQueryString
          ? `/api/organizations/${organizationId}/automation/schedules?${repositoryQueryString}`
          : `/api/organizations/${organizationId}/automation/schedules`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      return response.json();
    },
    enabled: !!organizationId && hasRepositories,
  });

  const schedules = data?.triggers ?? [];
  const displaySchedules = schedules.slice(0, 5);
  const isLoadingSchedules = isPending && hasRepositories;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-semibold text-lg">Schedules</h2>
          <p className="text-muted-foreground text-sm">
            Automated content generation on a recurring basis.
          </p>
        </div>
        {slug && (
          <Link href={`/${slug}/automation/schedule`}>
            <Button size="sm" variant="outline">
              View all
              <ArrowRightIcon className="ml-1 size-3.5" />
            </Button>
          </Link>
        )}
      </div>
      {isLoadingSchedules ? (
        <Skeleton className="h-18 w-full rounded-lg" />
      ) : isError ? (
        <div className="flex items-center justify-center rounded-lg border border-destructive/50 border-dashed p-8 text-destructive text-sm">
          Failed to load schedules.
        </div>
      ) : displaySchedules.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground text-sm">
          No schedules configured yet.
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {displaySchedules.map((schedule) => (
            <div
              className="flex items-center justify-between gap-4 px-4 py-3"
              key={schedule.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="truncate font-medium text-sm">
                  {schedule.name}
                </span>
                <span className="shrink-0 text-muted-foreground text-xs">
                  {formatFrequency(schedule.sourceConfig.cron)}
                </span>
              </div>
              <Badge variant={schedule.enabled ? "default" : "secondary"}>
                {schedule.enabled ? "Active" : "Paused"}
              </Badge>
            </div>
          ))}
          {schedules.length > 5 && (
            <div className="px-4 py-2 text-center">
              <Link
                className="text-muted-foreground text-xs hover:underline"
                href={`/${slug}/automation/schedule`}
              >
                +{schedules.length - 5} more schedules
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PageClient({ integrationId }: PageClientProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id;

  const { data: integration, isLoading: isLoadingIntegration } =
    useQuery<GitHubIntegration>({
      queryKey: QUERY_KEYS.INTEGRATIONS.detail(
        organizationId ?? "",
        integrationId
      ),
      queryFn: async () => {
        if (!organizationId) {
          throw new Error("Organization ID is required");
        }
        const response = await fetch(
          `/api/organizations/${organizationId}/integrations/${integrationId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch integration");
        }

        return response.json();
      },
      enabled: !!organizationId,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      initialData: () => {
        if (!organizationId) {
          return undefined;
        }

        const cachedIntegrations =
          queryClient.getQueryData<IntegrationsResponse>(
            QUERY_KEYS.INTEGRATIONS.all(organizationId)
          );

        return cachedIntegrations?.integrations.find(
          (cachedIntegration) => cachedIntegration.id === integrationId
        );
      },
    });

  if (!organizationId) {
    return null;
  }

  if (organizationId && isLoadingIntegration && !integration) {
    return <GitHubIntegrationDetailSkeleton />;
  }

  if (!integration) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full space-y-6 px-4 lg:px-6">
          <div className="rounded-xl border border-dashed p-12 text-center">
            <h3 className="font-medium text-lg">Integration not found</h3>
            <p className="text-muted-foreground text-sm">
              This integration may have been deleted or you don't have access to
              it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const primaryRepository = integration.repositories[0];
  const repositoryFullName =
    integration.repositories.length === 1 && primaryRepository
      ? `${primaryRepository.owner}/${primaryRepository.repo}`
      : null;
  const repositoryDefaultBranch =
    integration.repositories.length === 1
      ? (primaryRepository?.defaultBranch ?? null)
      : null;
  const formattedDate = format(new Date(integration.createdAt), "MMM d, yyyy");
  const createdLabel = integration.createdByUser
    ? `Added by ${integration.createdByUser.name} on ${formattedDate}`
    : `Created on ${formattedDate}`;
  const statusLabel = integration.enabled ? "Enabled" : "Disabled";

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <h1 className="font-bold text-3xl tracking-tight">
                      <span className="cursor-help">
                        {integration.displayName}
                      </span>
                    </h1>
                  }
                />
                <TooltipContent>{createdLabel}</TooltipContent>
              </Tooltip>
              <Badge variant={integration.enabled ? "default" : "secondary"}>
                {statusLabel}
              </Badge>
            </div>
            {repositoryFullName ? (
              <Link
                className="group flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
                href={
                  repositoryDefaultBranch
                    ? `https://github.com/${repositoryFullName}/tree/${repositoryDefaultBranch}`
                    : `https://github.com/${repositoryFullName}`
                }
                rel="noopener noreferrer"
                target="_blank"
              >
                <Github className="size-4 shrink-0" />
                <span>{repositoryFullName}</span>
                {repositoryDefaultBranch ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="size-1 rounded-full bg-muted-foreground/70"
                    />
                    <span>{repositoryDefaultBranch}</span>
                  </>
                ) : null}
                <ExternalLinkIcon className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ) : null}
            <p className="text-muted-foreground">
              Configure your GitHub integration and manage repositories
            </p>
          </div>
          <Button
            onClick={() => setEditDialogOpen(true)}
            size="sm"
            variant="outline"
          >
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Edit icon</title>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span className="ml-2">Edit</span>
          </Button>
        </div>

        <EditIntegrationDialog
          integration={integration}
          onOpenChange={setEditDialogOpen}
          open={editDialogOpen}
          organizationId={organizationId ?? ""}
        />

        <div className="space-y-6">
          <SchedulesSection
            organizationId={organizationId ?? ""}
            repositoryIds={integration.repositories.map((repo) => repo.id)}
            slug={activeOrganization?.slug ?? ""}
          />

          <EventsSection
            organizationId={organizationId ?? ""}
            repositoryIds={integration.repositories.map((repo) => repo.id)}
            slug={activeOrganization?.slug ?? ""}
          />

          {organizationId && integration.repositories.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-semibold text-lg">Webhook</h2>
                <p className="text-muted-foreground text-sm">
                  Receive events from GitHub when commits are pushed or releases
                  are published.
                </p>
              </div>
              {integration.repositories.map((repo) => (
                <WebhookSection
                  key={repo.id}
                  organizationId={organizationId}
                  repo={repo}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
