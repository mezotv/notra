"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@notra/ui/components/shared/responsive-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@notra/ui/components/ui/combobox";
import { Label } from "@notra/ui/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@notra/ui/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Switch } from "@notra/ui/components/ui/switch";
import { cn } from "@notra/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import {
  Check,
  ChevronDown,
  GitCommitHorizontal,
  GitPullRequest,
  Loader2,
  Plus,
  Rocket,
  RotateCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_CONTENT_TYPE,
  DEFAULT_DATA_POINTS,
  EVENT_BADGE,
  EVENTS_PER_PAGE,
} from "@/constants/content-preview";
import type {
  ContentDataPointSettings,
  OnDemandContentType,
  SelectedItems,
} from "@/schemas/content";
import type { LookbackWindow } from "@/schemas/integrations";
import {
  LOOKBACK_WINDOWS,
  SUPPORTED_SCHEDULE_OUTPUT_TYPES,
} from "@/schemas/integrations";
import type {
  CommitPreview,
  EventType,
  PreviewResponse,
  PrSelection,
  PullRequestPreview,
  ReleasePreview,
  ReleaseSelection,
  RepositoryPreview,
} from "@/types/content/preview";
import type { GitHubIntegration } from "@/types/integrations";
import {
  formatEventDate,
  getPageNumbers,
  prSelectionFromKey,
  prSelectionToKey,
  releaseSelectionFromKey,
  releaseSelectionToKey,
} from "@/utils/content-preview";
import { formatSnakeCaseLabel } from "@/utils/format";
import { getOutputTypeLabel, OutputTypeIcon } from "@/utils/output-types";
import { QUERY_KEYS } from "@/utils/query-keys";

interface CreateContentDialogProps {
  organizationId: string;
}

type Step = "configure" | "review";

export function CreateContentDialog({
  organizationId,
}: CreateContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("configure");
  const [dataSourcesOpen, setDataSourcesOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCommitKeys, setSelectedCommitKeys] = useState<Set<string>>(
    new Set()
  );
  const [selectedPrKeys, setSelectedPrKeys] = useState<Set<string>>(new Set());
  const [selectedReleaseKeys, setSelectedReleaseKeys] = useState<Set<string>>(
    new Set()
  );
  const lastInitializedParamsRef = useRef("");
  const previewWarningKeyRef = useRef<string>("");
  const selectionsTouchedRef = useRef(false);

  const queryClient = useQueryClient();
  const comboboxAnchor = useComboboxAnchor();

  const form = useForm({
    defaultValues: {
      contentType: DEFAULT_CONTENT_TYPE,
      lookbackWindow: "last_7_days" as LookbackWindow,
      repositoryIds: [] as string[],
      dataPoints: DEFAULT_DATA_POINTS,
    },
  });

  const { data: integrationsResponse, isLoading: isLoadingRepos } = useQuery<{
    integrations: Array<GitHubIntegration & { type: string }>;
  }>({
    queryKey: QUERY_KEYS.INTEGRATIONS.all(organizationId),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${organizationId}/integrations`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch integrations");
      }
      return res.json();
    },
    enabled: !!organizationId,
  });

  const { repositories, repositoryOptions } = useMemo(() => {
    const repos =
      integrationsResponse?.integrations
        .filter((i) => i.type === "github")
        .flatMap((i) => i.repositories) ?? [];
    return {
      repositories: repos,
      repositoryOptions: repos.map((r) => ({
        value: r.id,
        label: `${r.owner}/${r.repo}`,
      })),
    };
  }, [integrationsResponse]);

  useEffect(() => {
    if (open && repositories.length > 0) {
      const ids = form.getFieldValue("repositoryIds");
      if (ids.length === 0) {
        form.setFieldValue(
          "repositoryIds",
          repositories.map((r) => r.id)
        );
      }
    }
  }, [open, repositories, form]);

  const repositoryIds = useStore(form.store, (s) => s.values.repositoryIds);
  const lookbackWindow = useStore(form.store, (s) => s.values.lookbackWindow);
  const dataPoints = useStore(form.store, (s) => s.values.dataPoints);

  const previewParamsKey = useMemo(
    () =>
      JSON.stringify({
        repositoryIds,
        lookbackWindow,
        includeCommits: dataPoints.includeCommits,
        includePullRequests: dataPoints.includePullRequests,
        includeReleases: dataPoints.includeReleases,
      }),
    [repositoryIds, lookbackWindow, dataPoints]
  );

  const {
    data: previewResponse,
    isFetching: isLoadingPreview,
    isError: isPreviewError,
  } = useQuery<PreviewResponse, Error>({
    queryKey: [
      "content-preview",
      organizationId,
      repositoryIds,
      lookbackWindow,
      dataPoints.includeCommits,
      dataPoints.includePullRequests,
      dataPoints.includeReleases,
    ],
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${organizationId}/content/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repositoryIds,
            lookbackWindow,
            includeCommits: dataPoints.includeCommits,
            includePullRequests: dataPoints.includePullRequests,
            includeReleases: dataPoints.includeReleases,
          }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to fetch preview");
      }
      return res.json();
    },
    enabled: open && step === "review" && repositoryIds.length > 0,
    staleTime: 60_000,
  });

  const previewData = useMemo(
    () =>
      previewResponse?.repositories.map((r) => ({
        repositoryId: r.repositoryId,
        owner: r.owner,
        repo: r.repo,
        commits: r.commits ?? [],
        pullRequests: r.pullRequests ?? [],
        releases: r.releases ?? [],
      })),
    [previewResponse]
  );

  const previewFailures = previewResponse?.failures ?? [];

  useEffect(() => {
    if (!previewData || lastInitializedParamsRef.current === previewParamsKey) {
      return;
    }
    lastInitializedParamsRef.current = previewParamsKey;
    selectionsTouchedRef.current = false;
    setCurrentPage(1);
    const commitKeys = new Set<string>();
    const prKeys = new Set<string>();
    const relKeys = new Set<string>();
    for (const repo of previewData) {
      for (const commit of repo.commits) {
        commitKeys.add(commit.sha);
      }
      for (const pr of repo.pullRequests) {
        prKeys.add(
          prSelectionToKey({
            repositoryId: repo.repositoryId,
            number: pr.number,
          })
        );
      }
      for (const rel of repo.releases) {
        relKeys.add(
          releaseSelectionToKey({
            repositoryId: repo.repositoryId,
            tagName: rel.tagName,
          })
        );
      }
    }
    setSelectedCommitKeys(commitKeys);
    setSelectedPrKeys(prKeys);
    setSelectedReleaseKeys(relKeys);
  }, [previewData, previewParamsKey]);

  useEffect(() => {
    if (!previewFailures.length) {
      return;
    }

    const warningKey = `${previewParamsKey}:${previewFailures
      .map((failure) => `${failure.repositoryId}:${failure.stage}`)
      .sort()
      .join("|")}`;

    if (previewWarningKeyRef.current === warningKey) {
      return;
    }

    previewWarningKeyRef.current = warningKey;
    toast.warning(
      `${previewFailures.length} repository preview ${previewFailures.length === 1 ? "issue was" : "issues were"} detected. Review warnings before generating content.`
    );
  }, [previewParamsKey, previewFailures]);

  const mutation = useMutation<
    { success: boolean; runId: string },
    Error,
    {
      contentType: OnDemandContentType;
      lookbackWindow: LookbackWindow;
      repositoryIds: string[];
      dataPoints: ContentDataPointSettings;
      selectedItems?: SelectedItems;
    }
  >({
    mutationFn: async (value) => {
      const res = await fetch(
        `/api/organizations/${organizationId}/content/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        }
      );
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to create content");
      }
      return payload;
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Content generation started");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ACTIVE_GENERATIONS.list(organizationId),
      });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        form.reset();
        setStep("configure");
        setCurrentPage(1);
        setSelectedCommitKeys(new Set());
        setSelectedPrKeys(new Set());
        setSelectedReleaseKeys(new Set());
        lastInitializedParamsRef.current = "";
        selectionsTouchedRef.current = false;
      }
    },
    [form]
  );

  const handleContinue = useCallback(() => {
    setStep("review");
  }, []);

  const handleBack = useCallback(() => {
    setStep("configure");
    setCurrentPage(1);
  }, []);

  const handleCreate = useCallback(() => {
    const value = form.state.values;
    const selectedItems: SelectedItems | undefined =
      selectionsTouchedRef.current
        ? {
            commitShas: value.dataPoints.includeCommits
              ? Array.from(selectedCommitKeys)
              : [],
            pullRequestNumbers: value.dataPoints.includePullRequests
              ? Array.from(selectedPrKeys)
                  .map((key) => prSelectionFromKey(key))
                  .filter(
                    (selection): selection is PrSelection => selection !== null
                  )
              : [],
            releaseTagNames: value.dataPoints.includeReleases
              ? Array.from(selectedReleaseKeys)
                  .map((key) => releaseSelectionFromKey(key))
                  .filter(
                    (selection): selection is ReleaseSelection =>
                      selection !== null
                  )
              : [],
          }
        : undefined;
    mutation.mutate({ ...value, selectedItems });
  }, [form, mutation, selectedCommitKeys, selectedPrKeys, selectedReleaseKeys]);

  const eventCounts = useMemo(() => {
    if (!previewData) {
      return { total: 0, selected: 0 };
    }
    let total = 0;
    let selected = 0;
    for (const repo of previewData) {
      if (dataPoints.includeCommits) {
        total += repo.commits.length;
        for (const commit of repo.commits) {
          if (selectedCommitKeys.has(commit.sha)) {
            selected++;
          }
        }
      }
      if (dataPoints.includePullRequests) {
        total += repo.pullRequests.length;
        for (const pr of repo.pullRequests) {
          if (
            selectedPrKeys.has(
              prSelectionToKey({
                repositoryId: repo.repositoryId,
                number: pr.number,
              })
            )
          ) {
            selected++;
          }
        }
      }
      if (dataPoints.includeReleases) {
        total += repo.releases.length;
        for (const r of repo.releases) {
          if (
            selectedReleaseKeys.has(
              releaseSelectionToKey({
                repositoryId: repo.repositoryId,
                tagName: r.tagName,
              })
            )
          ) {
            selected++;
          }
        }
      }
    }
    return { total, selected };
  }, [
    previewData,
    dataPoints,
    selectedCommitKeys,
    selectedPrKeys,
    selectedReleaseKeys,
  ]);

  const { paginatedRepos, totalPages } = useMemo(() => {
    if (!previewData) {
      return { paginatedRepos: [], totalPages: 1 };
    }

    type FlatEvent =
      | {
          type: "release";
          repositoryId: string;
          owner: string;
          repo: string;
          data: ReleasePreview;
        }
      | {
          type: "pr";
          repositoryId: string;
          owner: string;
          repo: string;
          data: PullRequestPreview;
        }
      | {
          type: "commit";
          repositoryId: string;
          owner: string;
          repo: string;
          data: CommitPreview;
        };

    const flatEvents: FlatEvent[] = [];
    for (const repo of previewData) {
      if (dataPoints.includeReleases) {
        for (const release of repo.releases) {
          flatEvents.push({
            type: "release",
            repositoryId: repo.repositoryId,
            owner: repo.owner,
            repo: repo.repo,
            data: release,
          });
        }
      }
      if (dataPoints.includePullRequests) {
        for (const pr of repo.pullRequests) {
          flatEvents.push({
            type: "pr",
            repositoryId: repo.repositoryId,
            owner: repo.owner,
            repo: repo.repo,
            data: pr,
          });
        }
      }
      if (dataPoints.includeCommits) {
        for (const commit of repo.commits) {
          flatEvents.push({
            type: "commit",
            repositoryId: repo.repositoryId,
            owner: repo.owner,
            repo: repo.repo,
            data: commit,
          });
        }
      }
    }

    const pages = Math.max(1, Math.ceil(flatEvents.length / EVENTS_PER_PAGE));
    const start = (currentPage - 1) * EVENTS_PER_PAGE;
    const pageSlice = flatEvents.slice(start, start + EVENTS_PER_PAGE);

    const repoMap = new Map<string, RepositoryPreview>();
    for (const event of pageSlice) {
      let repo = repoMap.get(event.repositoryId);
      if (!repo) {
        repo = {
          repositoryId: event.repositoryId,
          owner: event.owner,
          repo: event.repo,
          commits: [],
          pullRequests: [],
          releases: [],
        };
        repoMap.set(event.repositoryId, repo);
      }
      if (event.type === "release") {
        repo.releases.push(event.data);
      } else if (event.type === "pr") {
        repo.pullRequests.push(event.data);
      } else {
        repo.commits.push(event.data);
      }
    }

    return { paginatedRepos: Array.from(repoMap.values()), totalPages: pages };
  }, [previewData, dataPoints, currentPage]);

  const handleToggleAll = useCallback(() => {
    if (!previewData) {
      return;
    }
    selectionsTouchedRef.current = true;
    const allSelected = eventCounts.selected === eventCounts.total;
    if (allSelected) {
      setSelectedCommitKeys(new Set());
      setSelectedPrKeys(new Set());
      setSelectedReleaseKeys(new Set());
    } else {
      const commitKeys = new Set<string>();
      const prKeys = new Set<string>();
      const relKeys = new Set<string>();
      for (const repo of previewData) {
        if (dataPoints.includeCommits) {
          for (const c of repo.commits) {
            commitKeys.add(c.sha);
          }
        }
        if (dataPoints.includePullRequests) {
          for (const pr of repo.pullRequests) {
            prKeys.add(
              prSelectionToKey({
                repositoryId: repo.repositoryId,
                number: pr.number,
              })
            );
          }
        }
        if (dataPoints.includeReleases) {
          for (const rel of repo.releases) {
            relKeys.add(
              releaseSelectionToKey({
                repositoryId: repo.repositoryId,
                tagName: rel.tagName,
              })
            );
          }
        }
      }
      setSelectedCommitKeys(commitKeys);
      setSelectedPrKeys(prKeys);
      setSelectedReleaseKeys(relKeys);
    }
  }, [previewData, dataPoints, eventCounts]);

  const hasSelectableEvents =
    dataPoints.includeCommits ||
    dataPoints.includePullRequests ||
    dataPoints.includeReleases;

  const hasAnyGitHubDataPointActive =
    dataPoints.includePullRequests ||
    dataPoints.includeCommits ||
    dataPoints.includeReleases;

  return (
    <ResponsiveDialog onOpenChange={handleOpenChange} open={open}>
      <ResponsiveDialogTrigger
        render={
          <Button disabled={!organizationId} size="sm">
            <Plus className="size-4" />
            Create Content
          </Button>
        }
      />
      <ResponsiveDialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <ResponsiveDialogHeader className="shrink-0 space-y-1 border-b p-4">
          <ResponsiveDialogTitle>
            {step === "configure" ? "Create Content" : "Review Events"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {step === "configure"
              ? "Configure content type, timeframe, and sources."
              : "Select the events to include in your content."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          className="!px-0 flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* ── Step 1: Configure ── */}
          {step === "configure" && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-4 p-4">
                <form.Field name="contentType">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Content Type</Label>
                      <Select
                        onValueChange={(v) => {
                          if (v) {
                            field.handleChange(v as OnDemandContentType);
                          }
                        }}
                        value={field.state.value}
                      >
                        <SelectTrigger className="w-full" id={field.name}>
                          <SelectValue placeholder="Select content type">
                            <span className="flex items-center gap-2">
                              <OutputTypeIcon
                                className="size-4"
                                outputType={field.state.value}
                              />
                              {getOutputTypeLabel(field.state.value)}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_SCHEDULE_OUTPUT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              <span className="flex items-center gap-2">
                                <OutputTypeIcon
                                  className="size-4"
                                  outputType={type}
                                />
                                {getOutputTypeLabel(type)}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                <form.Field name="lookbackWindow">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Timeframe</Label>
                      <Select
                        onValueChange={(v) => {
                          if (v) {
                            field.handleChange(v as LookbackWindow);
                          }
                        }}
                        value={field.state.value}
                      >
                        <SelectTrigger className="w-full" id={field.name}>
                          <SelectValue placeholder="Select timeframe">
                            <span className="capitalize">
                              {formatSnakeCaseLabel(field.state.value)}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {LOOKBACK_WINDOWS.map((w) => (
                            <SelectItem key={w} value={w}>
                              <span className="capitalize">
                                {formatSnakeCaseLabel(w)}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-xs">
                        How far back to look when gathering activity data.
                      </p>
                    </div>
                  )}
                </form.Field>

                <form.Field name="repositoryIds">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Repositories</Label>
                      {isLoadingRepos && <Skeleton className="h-10 w-full" />}
                      {!isLoadingRepos && repositories.length === 0 && (
                        <div className="rounded-md border border-dashed p-3 text-muted-foreground text-xs">
                          Add a GitHub repository first to scope content.
                        </div>
                      )}
                      {!isLoadingRepos && repositories.length > 0 && (
                        <div ref={comboboxAnchor}>
                          <Combobox
                            items={repositoryOptions.map((r) => r.value)}
                            multiple
                            onValueChange={(v) =>
                              field.handleChange(Array.isArray(v) ? v : [])
                            }
                            value={field.state.value}
                          >
                            <ComboboxChips>
                              {field.state.value.map((id) => {
                                const r = repositoryOptions.find(
                                  (o) => o.value === id
                                );
                                if (!r) {
                                  return null;
                                }
                                return (
                                  <ComboboxChip key={r.value}>
                                    {r.label}
                                  </ComboboxChip>
                                );
                              })}
                              <ComboboxChipsInput placeholder="Search repositories" />
                            </ComboboxChips>
                            <ComboboxContent anchor={comboboxAnchor.current}>
                              <ComboboxEmpty>
                                No repositories found.
                              </ComboboxEmpty>
                              <ComboboxList>
                                {repositoryOptions.map((r) => (
                                  <ComboboxItem key={r.value} value={r.value}>
                                    {r.label}
                                  </ComboboxItem>
                                ))}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        </div>
                      )}
                      <p className="text-muted-foreground text-xs">
                        Pick one or more repositories.
                      </p>
                    </div>
                  )}
                </form.Field>

                <Collapsible
                  defaultOpen={false}
                  onOpenChange={setDataSourcesOpen}
                  open={dataSourcesOpen}
                >
                  <CollapsibleTrigger className="flex w-full items-center gap-2 font-medium text-sm">
                    <ChevronDown
                      className={`size-4 transition-transform ${dataSourcesOpen ? "" : "-rotate-90"}`}
                    />
                    Data Sources
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    <form.Field name="dataPoints.includePullRequests">
                      {(field) => (
                        <DataPointToggle
                          checked={field.state.value}
                          description="Include PR metadata and summaries."
                          disabled={mutation.isPending}
                          label="Pull Requests"
                          onCheckedChange={field.handleChange}
                        />
                      )}
                    </form.Field>
                    <form.Field name="dataPoints.includeCommits">
                      {(field) => (
                        <DataPointToggle
                          checked={field.state.value}
                          description="Include commit-level change data."
                          disabled={mutation.isPending}
                          label="Commits"
                          onCheckedChange={field.handleChange}
                        />
                      )}
                    </form.Field>
                    <form.Field name="dataPoints.includeReleases">
                      {(field) => (
                        <DataPointToggle
                          checked={field.state.value}
                          description="Include GitHub releases and changelogs."
                          disabled={mutation.isPending}
                          label="Releases"
                          onCheckedChange={field.handleChange}
                        />
                      )}
                    </form.Field>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          )}

          {/* ── Step 2: Review Events ── */}
          {step === "review" && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {isLoadingPreview && (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-8 w-full" />
                </div>
              )}
              {!isLoadingPreview && isPreviewError && (
                <div className="p-4">
                  <div className="flex flex-col items-center gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-center text-sm">
                    <p>Failed to load events.</p>
                    <Button
                      onClick={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["content-preview", organizationId],
                        })
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <RotateCw className="size-3.5" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}
              {!isLoadingPreview &&
                !isPreviewError &&
                previewFailures.length > 0 && (
                  <div className="shrink-0 px-4 pt-4">
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 text-xs dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
                      <p className="font-medium text-sm">
                        Partial preview ({previewFailures.length} warning
                        {previewFailures.length === 1 ? "" : "s"})
                      </p>
                      {previewFailures.slice(0, 3).map((failure) => (
                        <p
                          className="mt-1"
                          key={`${failure.repositoryId}:${failure.stage}`}
                        >
                          {(failure.owner && failure.repo
                            ? `${failure.owner}/${failure.repo}`
                            : failure.repositoryId) +
                            ": " +
                            failure.message}
                        </p>
                      ))}
                      {previewFailures.length > 3 && (
                        <p className="mt-1">
                          +{previewFailures.length - 3} more warnings
                        </p>
                      )}
                    </div>
                  </div>
                )}
              {!isLoadingPreview && !isPreviewError && previewData && (
                <>
                  {eventCounts.total > 0 && (
                    <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
                      <span className="text-muted-foreground text-xs">
                        {eventCounts.selected} / {eventCounts.total} selected
                        {totalPages > 1 &&
                          ` · Page ${currentPage} of ${totalPages}`}
                      </span>
                      <Button
                        onClick={handleToggleAll}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        {eventCounts.selected === eventCounts.total
                          ? "Deselect all"
                          : "Select all"}
                      </Button>
                    </div>
                  )}
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="space-y-3 p-4">
                      {eventCounts.total === 0 ? (
                        <div className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-xs">
                          No events found for the selected timeframe.
                        </div>
                      ) : (
                        paginatedRepos.map((repo) => (
                          <RepoSection
                            dataPoints={dataPoints}
                            key={repo.repositoryId}
                            onToggleCommit={(sha) => {
                              selectionsTouchedRef.current = true;
                              setSelectedCommitKeys((prev) => {
                                const next = new Set(prev);
                                if (next.has(sha)) {
                                  next.delete(sha);
                                } else {
                                  next.add(sha);
                                }
                                return next;
                              });
                            }}
                            onTogglePr={(key) => {
                              selectionsTouchedRef.current = true;
                              setSelectedPrKeys((prev) => {
                                const next = new Set(prev);
                                if (next.has(key)) {
                                  next.delete(key);
                                } else {
                                  next.add(key);
                                }
                                return next;
                              });
                            }}
                            onToggleRelease={(tag) => {
                              selectionsTouchedRef.current = true;
                              setSelectedReleaseKeys((prev) => {
                                const next = new Set(prev);
                                if (next.has(tag)) {
                                  next.delete(tag);
                                } else {
                                  next.add(tag);
                                }
                                return next;
                              });
                            }}
                            repo={repo}
                            selectedCommitKeys={selectedCommitKeys}
                            selectedPrKeys={selectedPrKeys}
                            selectedReleaseKeys={selectedReleaseKeys}
                          />
                        ))
                      )}
                      {totalPages > 1 && (
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                className={cn(
                                  currentPage === 1 &&
                                    "pointer-events-none opacity-50"
                                )}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage((p) => Math.max(1, p - 1));
                                }}
                              />
                            </PaginationItem>
                            {getPageNumbers(currentPage, totalPages).map(
                              (page, i) =>
                                page === "ellipsis" ? (
                                  <PaginationItem key={`ellipsis-${i}`}>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                ) : (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      isActive={page === currentPage}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setCurrentPage(page);
                                      }}
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                )
                            )}
                            <PaginationItem>
                              <PaginationNext
                                className={cn(
                                  currentPage === totalPages &&
                                    "pointer-events-none opacity-50"
                                )}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage((p) =>
                                    Math.min(totalPages, p + 1)
                                  );
                                }}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="shrink-0 rounded-b-xl border-t bg-muted/50 p-4">
            {step === "configure" && (
              <div className="flex items-center justify-end">
                <Button
                  disabled={
                    repositoryIds.length === 0 || !hasAnyGitHubDataPointActive
                  }
                  onClick={handleContinue}
                  type="button"
                >
                  Continue
                </Button>
              </div>
            )}
            {step === "review" && (
              <div className="flex items-center justify-between">
                <Button
                  disabled={mutation.isPending}
                  onClick={handleBack}
                  type="button"
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  disabled={
                    mutation.isPending ||
                    isLoadingPreview ||
                    (hasSelectableEvents &&
                      eventCounts.total > 0 &&
                      eventCounts.selected === 0)
                  }
                  onClick={handleCreate}
                  type="button"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Create content"
                  )}
                </Button>
              </div>
            )}
          </div>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function DataPointToggle({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function RepoSection({
  repo,
  dataPoints,
  selectedCommitKeys,
  selectedPrKeys,
  selectedReleaseKeys,
  onToggleCommit,
  onTogglePr,
  onToggleRelease,
}: {
  repo: RepositoryPreview;
  dataPoints: ContentDataPointSettings;
  selectedCommitKeys: Set<string>;
  selectedPrKeys: Set<string>;
  selectedReleaseKeys: Set<string>;
  onToggleCommit: (sha: string) => void;
  onTogglePr: (key: string) => void;
  onToggleRelease: (key: string) => void;
}) {
  const showCommits = dataPoints.includeCommits && repo.commits.length > 0;
  const showPrs =
    dataPoints.includePullRequests && repo.pullRequests.length > 0;
  const showReleases = dataPoints.includeReleases && repo.releases.length > 0;

  if (!showCommits && !showPrs && !showReleases) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="bg-muted/30 px-3 py-2">
        <span className="font-medium text-sm">
          {repo.owner}/{repo.repo}
        </span>
      </div>
      <div className="divide-y">
        {showReleases &&
          repo.releases.map((release) => {
            const releaseKey = releaseSelectionToKey({
              repositoryId: repo.repositoryId,
              tagName: release.tagName,
            });
            return (
              <EventRow
                key={releaseKey}
                label={release.name || release.tagName}
                meta={`${release.authorLogin} · ${formatEventDate(release.publishedAt)}${release.prerelease ? " · pre-release" : ""}`}
                onToggle={() => onToggleRelease(releaseKey)}
                selected={selectedReleaseKeys.has(releaseKey)}
                type="Release"
              />
            );
          })}
        {showPrs &&
          repo.pullRequests.map((pr) => {
            const prKey = prSelectionToKey({
              repositoryId: repo.repositoryId,
              number: pr.number,
            });
            return (
              <EventRow
                key={prKey}
                label={`#${pr.number} ${pr.title}`}
                meta={`${pr.authorLogin} · ${pr.mergedAt ? formatEventDate(pr.mergedAt) : ""}`}
                onToggle={() => onTogglePr(prKey)}
                selected={selectedPrKeys.has(prKey)}
                type="PR"
              />
            );
          })}
        {showCommits &&
          repo.commits.map((commit) => (
            <EventRow
              key={commit.sha}
              label={commit.message}
              meta={`${commit.authorName} · ${commit.authoredAt ? formatEventDate(commit.authoredAt) : ""} · ${commit.sha.slice(0, 7)}`}
              onToggle={() => onToggleCommit(commit.sha)}
              selected={selectedCommitKeys.has(commit.sha)}
              type="Commit"
            />
          ))}
      </div>
    </div>
  );
}

function EventRow({
  label,
  meta,
  type,
  selected,
  onToggle,
}: {
  label: string;
  meta: string;
  type: EventType;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/50",
        selected && "bg-muted/20"
      )}
      onClick={onToggle}
      type="button"
    >
      <div
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30"
        )}
      >
        {selected && <Check className="size-3" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{label}</p>
        <p className="truncate text-muted-foreground text-xs">{meta}</p>
      </div>
      <Badge className={cn("shrink-0", EVENT_BADGE[type])}>
        {type === "PR" && <GitPullRequest className="size-3!" />}
        {type === "Commit" && <GitCommitHorizontal className="size-3!" />}
        {type === "Release" && <Rocket className="size-3!" />}
        {type}
      </Badge>
    </button>
  );
}
