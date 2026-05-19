"use client";

import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Loading03Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { cn } from "@notra/ui/lib/utils";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { StepActivity } from "@/components/content/create/step-activity";
import { StepBrandIdentities } from "@/components/content/create/step-brand-identities";
import { StepFormats } from "@/components/content/create/step-formats";
import { AddIntegrationDialog } from "@/components/integrations/add-integration-dialog";
import { AddRepositoryDialog } from "@/components/integrations/add-repository-dialog";
import { DEFAULT_DATA_POINTS } from "@/constants/content-preview";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  ContentDataPointSettings,
  OnDemandContentType,
  SelectedItems,
} from "@/schemas/content";
import type { LookbackWindow } from "@/schemas/integrations";
import type { IntegrationOption, WizardStep } from "@/types/content/create";
import type { PrSelection, ReleaseSelection } from "@/types/content/preview";
import {
  prSelectionFromKey,
  prSelectionToKey,
  releaseSelectionFromKey,
  releaseSelectionToKey,
} from "@/utils/content-preview";

interface CreateContentDialogProps {
  organizationId: string;
}

const STEP_ORDER: WizardStep[] = ["formats", "activity", "identities"];

const STEP_TITLES: Record<WizardStep, string> = {
  formats: "Create Content",
  activity: "Activity",
  identities: "Brand Identity",
};

const STEP_LABELS: Record<WizardStep, string> = {
  formats: "Formats",
  activity: "Activity",
  identities: "Identity",
};

export function CreateContentDialog({
  organizationId,
}: CreateContentDialogProps) {
  const [open, setOpen] = useState(false);

  useHotkey(
    "C",
    () => {
      if (organizationId) {
        setOpen(true);
      }
    },
    { enabled: !open }
  );

  const queryClient = useQueryClient();

  const [step, setStep] = useState<WizardStep>("formats");
  const [selectedFormats, setSelectedFormats] = useState<OnDemandContentType[]>(
    []
  );
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [selectedBrandVoiceIds, setSelectedBrandVoiceIds] = useState<string[]>(
    []
  );
  const [lookbackWindow, setLookbackWindow] =
    useState<LookbackWindow>("last_7_days");
  const [dataPoints, setDataPoints] =
    useState<ContentDataPointSettings>(DEFAULT_DATA_POINTS);

  const [selectedCommitKeys, setSelectedCommitKeys] = useState<Set<string>>(
    new Set()
  );
  const [selectedPrKeys, setSelectedPrKeys] = useState<Set<string>>(new Set());
  const [selectedReleaseKeys, setSelectedReleaseKeys] = useState<Set<string>>(
    new Set()
  );
  const [selectedLinearKeys, setSelectedLinearKeys] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const integrationsInitializedRef = useRef(false);

  const selectionsTouchedRef = useRef(false);
  const lastInitializedParamsRef = useRef("");
  const previewWarningKeyRef = useRef("");

  const [addRepoOpen, setAddRepoOpen] = useState(false);
  const [addRepoMode, setAddRepoMode] = useState<
    "integration" | "repository" | null
  >(null);
  const [waitingForWebhookSetup, setWaitingForWebhookSetup] = useState(false);
  const openingAddRepoFlowRef = useRef(false);

  const { data: brandResponse, isLoading: isLoadingVoices } = useQuery(
    dashboardOrpc.brand.voices.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );
  const brandVoices = brandResponse?.voices ?? [];

  const { data: integrationsResponse, isLoading: isLoadingRepos } = useQuery(
    dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );

  const { integrationOptions, githubIntegrationId } = useMemo(() => {
    const githubIntegrations =
      integrationsResponse?.integrations.filter(
        (i) => i.type === "github" && i.enabled
      ) ?? [];
    const linearIntegrationsList =
      integrationsResponse?.integrations.filter(
        (i) => i.type === "linear" && i.enabled
      ) ?? [];
    const repos = githubIntegrations.flatMap((i) =>
      i.repositories.filter((r) => r.enabled)
    );

    const options: IntegrationOption[] = [
      ...repos.map((r) => ({
        value: r.id,
        label: r.defaultBranch
          ? `${r.owner}/${r.repo} · ${r.defaultBranch}`
          : `${r.owner}/${r.repo}`,
        ownerRepo: `${r.owner}/${r.repo}`,
        type: "github" as const,
      })),
      ...linearIntegrationsList.map((i) => ({
        value: `linear:${i.id}`,
        label: i.displayName,
        ownerRepo: null,
        type: "linear" as const,
      })),
    ];

    return {
      integrationOptions: options,
      githubIntegrationId: githubIntegrations[0]?.id,
    };
  }, [integrationsResponse]);

  const githubRepoIds = useMemo(
    () => selectedRepoIds.filter((id) => !id.startsWith("linear:")),
    [selectedRepoIds]
  );

  const selectedLinearIds = useMemo(
    () =>
      selectedRepoIds
        .filter((id) => id.startsWith("linear:"))
        .map((id) => id.replace("linear:", "")),
    [selectedRepoIds]
  );

  const previewParamsKey = useMemo(
    () =>
      JSON.stringify({
        repositoryIds: githubRepoIds,
        linearIntegrationIds: selectedLinearIds,
        lookbackWindow,
        includeCommits: dataPoints.includeCommits,
        includePullRequests: dataPoints.includePullRequests,
        includeReleases: dataPoints.includeReleases,
      }),
    [githubRepoIds, selectedLinearIds, lookbackWindow, dataPoints]
  );

  const previewQueryOptions = dashboardOrpc.content.preview.queryOptions({
    input: {
      organizationId,
      repositoryIds: githubRepoIds,
      lookbackWindow,
      includeCommits: dataPoints.includeCommits,
      includePullRequests: dataPoints.includePullRequests,
      includeReleases: dataPoints.includeReleases,
      linearIntegrationIds:
        selectedLinearIds.length > 0 ? selectedLinearIds : undefined,
    },
  });

  const {
    data: previewResponse,
    isFetching: isLoadingPreview,
    isError: isPreviewError,
    refetch: refetchPreview,
  } = useQuery({
    ...previewQueryOptions,
    enabled:
      open &&
      step === "activity" &&
      (githubRepoIds.length > 0 || selectedLinearIds.length > 0),
    staleTime: 60_000,
  });

  const handleRetryPreview = useCallback(() => {
    refetchPreview();
  }, [refetchPreview]);

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
    if (
      (!previewData && !previewResponse?.linearIntegrations) ||
      lastInitializedParamsRef.current === previewParamsKey
    ) {
      return;
    }
    lastInitializedParamsRef.current = previewParamsKey;
    selectionsTouchedRef.current = false;
    const commitKeys = new Set<string>();
    const prKeys = new Set<string>();
    const relKeys = new Set<string>();
    const linearKeys = new Set<string>();
    for (const repo of previewData ?? []) {
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
    for (const li of previewResponse?.linearIntegrations ?? []) {
      for (const issue of li.issues) {
        linearKeys.add(`${li.integrationId}:${issue.id}`);
      }
    }
    setSelectedCommitKeys(commitKeys);
    setSelectedPrKeys(prKeys);
    setSelectedReleaseKeys(relKeys);
    setSelectedLinearKeys(linearKeys);
  }, [previewData, previewParamsKey, previewResponse?.linearIntegrations]);

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
      `${previewFailures.length} repository preview ${previewFailures.length === 1 ? "issue was" : "issues were"} detected.`
    );
  }, [previewParamsKey, previewFailures]);

  const mutation = useMutation<
    { succeeded: number; total: number },
    Error,
    {
      formats: OnDemandContentType[];
      voiceIds: string[];
      selectedItems: SelectedItems;
    }
  >({
    mutationFn: async ({ formats, voiceIds, selectedItems }) => {
      const hasLinear = selectedLinearIds.length > 0;
      const calls = formats.flatMap((format) =>
        voiceIds.map((voiceId) => ({ format, voiceId }))
      );
      // TODO: replace this client-side fan-out with a single boss agent
      // that delegates to N sub-agents (one per format), with the boss
      // deciding the angle / topic each sub-agent writes about so the
      // outputs are coordinated instead of independently drafted.
      const results = await Promise.allSettled(
        calls.map(({ format, voiceId }) =>
          dashboardOrpc.content.generate.call({
            organizationId,
            contentType: format,
            lookbackWindow,
            repositoryIds: githubRepoIds,
            linearIntegrationIds: hasLinear ? selectedLinearIds : undefined,
            brandVoiceId: voiceId || undefined,
            dataPoints: { ...dataPoints, includeLinearData: hasLinear },
            selectedItems,
          })
        )
      );
      const failures = results.filter((r) => r.status === "rejected");
      const succeeded = results.length - failures.length;
      if (succeeded === 0) {
        const reason = failures[0];
        const message =
          reason &&
          reason.status === "rejected" &&
          reason.reason instanceof Error
            ? reason.reason.message
            : "Failed to start any content generation";
        throw new Error(message);
      }
      return { succeeded, total: results.length };
    },
    onSuccess: ({ succeeded, total }) => {
      setOpen(false);
      if (succeeded === total) {
        toast.success(
          succeeded === 1
            ? "Content generation started"
            : `${succeeded} content generations started`
        );
      } else {
        toast.warning(
          `${succeeded} of ${total} content generations started; ${total - succeeded} failed`
        );
      }
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.content.activeGenerations.list.queryKey({
          input: { organizationId },
        }),
      });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const resetWizard = useCallback(() => {
    setStep("formats");
    setSelectedFormats([]);
    setSelectedRepoIds([]);
    setSelectedBrandVoiceIds([]);
    setLookbackWindow("last_7_days");
    setDataPoints(DEFAULT_DATA_POINTS);
    setSelectedCommitKeys(new Set());
    setSelectedPrKeys(new Set());
    setSelectedReleaseKeys(new Set());
    setSelectedLinearKeys(new Set());
    setSearchQuery("");
    lastInitializedParamsRef.current = "";
    selectionsTouchedRef.current = false;
    integrationsInitializedRef.current = false;
  }, []);

  useEffect(() => {
    if (
      integrationsInitializedRef.current ||
      integrationOptions.length === 0 ||
      selectedRepoIds.length > 0
    ) {
      return;
    }
    integrationsInitializedRef.current = true;
    setSelectedRepoIds(integrationOptions.map((opt) => opt.value));
  }, [integrationOptions, selectedRepoIds.length]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        const preserveState =
          openingAddRepoFlowRef.current || addRepoMode !== null;
        openingAddRepoFlowRef.current = false;
        if (preserveState) {
          return;
        }
        setAddRepoOpen(false);
        setAddRepoMode(null);
        setWaitingForWebhookSetup(false);
        resetWizard();
      }
    },
    [addRepoMode, resetWizard]
  );

  const toggleFormat = useCallback((format: OnDemandContentType) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  }, []);

  const handleDataPointChange = useCallback(
    (key: keyof ContentDataPointSettings, value: boolean) => {
      setDataPoints((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleRepoId = useCallback((value: string) => {
    setSelectedRepoIds((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  const toggleVoiceId = useCallback((id: string) => {
    setSelectedBrandVoiceIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }, []);

  const eventCounts = useMemo(() => {
    let total = 0;
    let selected = 0;
    for (const repo of previewData ?? []) {
      if (dataPoints.includeCommits) {
        total += repo.commits.length;
        for (const c of repo.commits) {
          if (selectedCommitKeys.has(c.sha)) {
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
    for (const li of previewResponse?.linearIntegrations ?? []) {
      total += li.issues.length;
      for (const issue of li.issues) {
        if (selectedLinearKeys.has(`${li.integrationId}:${issue.id}`)) {
          selected++;
        }
      }
    }
    return { total, selected };
  }, [
    previewData,
    previewResponse?.linearIntegrations,
    dataPoints,
    selectedCommitKeys,
    selectedPrKeys,
    selectedReleaseKeys,
    selectedLinearKeys,
  ]);

  const handleToggleAll = useCallback(() => {
    selectionsTouchedRef.current = true;
    const allSelected = eventCounts.selected === eventCounts.total;
    if (allSelected) {
      setSelectedCommitKeys(new Set());
      setSelectedPrKeys(new Set());
      setSelectedReleaseKeys(new Set());
      setSelectedLinearKeys(new Set());
      return;
    }
    const commitKeys = new Set<string>();
    const prKeys = new Set<string>();
    const relKeys = new Set<string>();
    const linearKeys = new Set<string>();
    for (const repo of previewData ?? []) {
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
    for (const li of previewResponse?.linearIntegrations ?? []) {
      for (const issue of li.issues) {
        linearKeys.add(`${li.integrationId}:${issue.id}`);
      }
    }
    setSelectedCommitKeys(commitKeys);
    setSelectedPrKeys(prKeys);
    setSelectedReleaseKeys(relKeys);
    setSelectedLinearKeys(linearKeys);
  }, [
    previewData,
    previewResponse?.linearIntegrations,
    dataPoints,
    eventCounts,
  ]);

  const goNext = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1] as WizardStep);
    }
  }, [step]);

  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) {
      setStep(STEP_ORDER[idx - 1] as WizardStep);
    }
  }, [step]);

  const buildSelectedItems = useCallback((): SelectedItems => {
    if (!selectionsTouchedRef.current) {
      return undefined;
    }
    const hasLinear = selectedLinearIds.length > 0;
    const commitShas = dataPoints.includeCommits
      ? Array.from(selectedCommitKeys)
      : undefined;
    const pullRequestNumbers = dataPoints.includePullRequests
      ? Array.from(selectedPrKeys)
          .map((key) => prSelectionFromKey(key))
          .filter((sel): sel is PrSelection => sel !== null)
      : undefined;
    const releaseTagNames = dataPoints.includeReleases
      ? Array.from(selectedReleaseKeys)
          .map((key) => releaseSelectionFromKey(key))
          .filter((sel): sel is ReleaseSelection => sel !== null)
      : undefined;
    const linearIssueIds =
      hasLinear && selectedLinearKeys.size > 0
        ? Array.from(selectedLinearKeys).map((key) => {
            const sep = key.indexOf(":");
            return {
              integrationId: key.slice(0, sep),
              issueId: key.slice(sep + 1),
            };
          })
        : undefined;

    if (
      !(
        commitShas?.length ||
        pullRequestNumbers?.length ||
        releaseTagNames?.length ||
        linearIssueIds?.length
      )
    ) {
      return undefined;
    }
    return {
      commitShas,
      pullRequestNumbers,
      releaseTagNames,
      linearIssueIds,
    };
  }, [
    dataPoints,
    selectedCommitKeys,
    selectedPrKeys,
    selectedReleaseKeys,
    selectedLinearKeys,
    selectedLinearIds,
  ]);

  const handleCreate = useCallback(() => {
    const voiceIds =
      selectedBrandVoiceIds.length > 0 ? selectedBrandVoiceIds : [""];
    mutation.mutate({
      formats: selectedFormats,
      voiceIds,
      selectedItems: buildSelectedItems(),
    });
  }, [selectedBrandVoiceIds, selectedFormats, mutation, buildSelectedItems]);

  const handleOpenAddRepositoryFlow = useCallback(() => {
    openingAddRepoFlowRef.current = true;
    setAddRepoMode(githubIntegrationId ? "repository" : "integration");
    setWaitingForWebhookSetup(false);
    setAddRepoOpen(true);
    setOpen(false);
  }, [githubIntegrationId]);

  const handleAddRepoOpenChange = useCallback(
    (isOpen: boolean) => {
      setAddRepoOpen(isOpen);
      if (isOpen) {
        return;
      }
      if (addRepoMode === "integration" && waitingForWebhookSetup) {
        return;
      }
      setAddRepoMode(null);
      setWaitingForWebhookSetup(false);
      setOpen(true);
    },
    [addRepoMode, waitingForWebhookSetup]
  );

  const handleIntegrationSuccess = useCallback(() => {
    setWaitingForWebhookSetup(true);
  }, []);

  const handleIntegrationFlowComplete = useCallback(() => {
    setAddRepoMode(null);
    setWaitingForWebhookSetup(false);
    setOpen(true);
  }, []);

  const canContinueFromFormats = selectedFormats.length > 0;
  const canContinueFromActivity =
    selectedRepoIds.length > 0 && !isLoadingPreview && eventCounts.selected > 0;

  const continueDisabled =
    (step === "formats" && !canContinueFromFormats) ||
    (step === "activity" && !canContinueFromActivity);

  const identityButtonLabel =
    selectedBrandVoiceIds.length === 0
      ? "Skip & start creating"
      : `Start creating with ${selectedBrandVoiceIds.length} ${selectedBrandVoiceIds.length === 1 ? "identity" : "identities"}`;

  const stepIndex = STEP_ORDER.indexOf(step);

  const footerLeft = useMemo(() => {
    if (step === "formats") {
      return `${selectedFormats.length} format${selectedFormats.length === 1 ? "" : "s"} selected`;
    }
    if (step === "activity") {
      if (selectedRepoIds.length === 0) {
        return "Select at least one source";
      }
      return `${eventCounts.selected} / ${eventCounts.total} events · ${selectedRepoIds.length} source${selectedRepoIds.length === 1 ? "" : "s"}`;
    }
    return selectedBrandVoiceIds.length === 0
      ? "No identities selected"
      : `${selectedBrandVoiceIds.length} ${selectedBrandVoiceIds.length === 1 ? "identity" : "identities"} selected`;
  }, [
    step,
    selectedFormats.length,
    selectedRepoIds.length,
    eventCounts,
    selectedBrandVoiceIds.length,
  ]);

  return (
    <>
      <ResponsiveDialog onOpenChange={handleOpenChange} open={open}>
        <ResponsiveDialogTrigger
          render={
            <Button className="gap-1.5" disabled={!organizationId}>
              <HugeiconsIcon className="size-4" icon={Add01Icon} />
              Create Content
              <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
            </Button>
          }
        />
        <ResponsiveDialogContent className="flex h-[85vh] max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <ResponsiveDialogHeader className="shrink-0 border-b p-4 pr-14">
            <div className="flex items-center justify-between gap-4">
              <ResponsiveDialogTitle className="text-base">
                {STEP_TITLES[step]}
              </ResponsiveDialogTitle>
              <StepProgress activeIndex={stepIndex} />
            </div>
          </ResponsiveDialogHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {step === "formats" && (
                <StepFormats
                  dataPoints={dataPoints}
                  lookbackWindow={lookbackWindow}
                  onDataPointChange={handleDataPointChange}
                  onLookbackChange={setLookbackWindow}
                  onToggle={toggleFormat}
                  selected={selectedFormats}
                />
              )}
              {step === "activity" && (
                <StepActivity
                  dataPoints={dataPoints}
                  integrationOptions={integrationOptions}
                  isLoadingIntegrations={isLoadingRepos}
                  isLoadingPreview={isLoadingPreview}
                  isPreviewError={isPreviewError}
                  onConnect={handleOpenAddRepositoryFlow}
                  onRetryPreview={handleRetryPreview}
                  onSearchQueryChange={setSearchQuery}
                  onToggleCommit={(key) => {
                    selectionsTouchedRef.current = true;
                    setSelectedCommitKeys((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) {
                        next.delete(key);
                      } else {
                        next.add(key);
                      }
                      return next;
                    });
                  }}
                  onToggleIntegration={toggleRepoId}
                  onToggleLinear={(key) => {
                    selectionsTouchedRef.current = true;
                    setSelectedLinearKeys((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) {
                        next.delete(key);
                      } else {
                        next.add(key);
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
                  onToggleRelease={(key) => {
                    selectionsTouchedRef.current = true;
                    setSelectedReleaseKeys((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) {
                        next.delete(key);
                      } else {
                        next.add(key);
                      }
                      return next;
                    });
                  }}
                  organizationId={organizationId}
                  preview={previewResponse}
                  repositories={previewData}
                  searchQuery={searchQuery}
                  selectedCommitKeys={selectedCommitKeys}
                  selectedIntegrationIds={selectedRepoIds}
                  selectedLinearKeys={selectedLinearKeys}
                  selectedPrKeys={selectedPrKeys}
                  selectedReleaseKeys={selectedReleaseKeys}
                />
              )}
              {step === "identities" && (
                <StepBrandIdentities
                  isLoading={isLoadingVoices}
                  onToggle={toggleVoiceId}
                  organizationId={organizationId}
                  selected={selectedBrandVoiceIds}
                  voices={brandVoices}
                />
              )}
            </div>

            <div className="shrink-0 border-t bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {step !== "formats" && (
                    <Button
                      disabled={mutation.isPending}
                      onClick={goBack}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <HugeiconsIcon
                        className="size-3.5"
                        icon={ArrowLeft01Icon}
                      />
                      Back
                    </Button>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {footerLeft}
                  </span>
                </div>
                {step === "identities" ? (
                  <Button
                    disabled={
                      mutation.isPending || selectedFormats.length === 0
                    }
                    onClick={handleCreate}
                    type="button"
                  >
                    {mutation.isPending ? (
                      <>
                        <HugeiconsIcon
                          className="size-4 animate-spin"
                          icon={Loading03Icon}
                        />
                        Generating...
                      </>
                    ) : (
                      <>
                        {identityButtonLabel}
                        <HugeiconsIcon
                          className="size-3.5"
                          icon={ArrowRight01Icon}
                        />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    disabled={continueDisabled}
                    onClick={goNext}
                    type="button"
                  >
                    Continue
                    <HugeiconsIcon
                      className="size-3.5"
                      icon={ArrowRight01Icon}
                    />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
      {addRepoMode === "repository" && githubIntegrationId && (
        <AddRepositoryDialog
          integrationId={githubIntegrationId}
          onOpenChange={handleAddRepoOpenChange}
          open={addRepoOpen}
          organizationId={organizationId}
        />
      )}
      {addRepoMode === "integration" && (
        <AddIntegrationDialog
          onFlowComplete={handleIntegrationFlowComplete}
          onOpenChange={handleAddRepoOpenChange}
          onSuccess={handleIntegrationSuccess}
          open={addRepoOpen}
          organizationId={organizationId}
        />
      )}
    </>
  );
}

interface StepProgressProps {
  activeIndex: number;
}

function StepProgress({ activeIndex }: StepProgressProps) {
  return (
    <div className="flex items-center gap-2">
      {STEP_ORDER.map((stepKey, idx) => {
        const isCompleted = idx < activeIndex;
        const isActive = idx === activeIndex;
        return (
          <div className="flex items-center gap-2" key={stepKey}>
            <div
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full font-medium text-[10px] transition-colors",
                isActive && "bg-foreground text-background",
                isCompleted && "bg-foreground/80 text-background",
                !(isActive || isCompleted) && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <HugeiconsIcon className="size-3" icon={Tick01Icon} />
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={cn(
                "hidden text-xs sm:inline",
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {STEP_LABELS[stepKey]}
            </span>
            {idx < STEP_ORDER.length - 1 && (
              <div
                className={cn(
                  "hidden h-px w-4 sm:block",
                  isCompleted ? "bg-foreground/40" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
