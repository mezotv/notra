"use client";

import type { ToneProfile } from "@notra/ai/schemas/tone";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@notra/ui/components/ui/alert";
import { useHotkey } from "@tanstack/react-hotkeys";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useReducer, useRef } from "react";
import { toast } from "sonner";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { getValidLanguage } from "@/schemas/brand";
import {
  findSelectedBrandIdentity,
  readStoredBrandIdentityId,
  writeStoredBrandIdentityId,
} from "@/utils/brand-identity-selection";
import { formatRelativeTime } from "@/utils/format";
import {
  useAnalyzeBrand,
  useBrandAnalysisProgress,
  useBrandSettings,
  useBrandVoiceAffectedTriggers,
  useDeleteBrandVoice,
  useSetDefaultBrandVoice,
} from "../../../../../lib/hooks/use-brand-analysis";
import { useReferences } from "../../../../../lib/hooks/use-brand-references";
import { useSitemaps } from "../../../../../lib/hooks/use-brand-sitemaps";
import { AddIdentityDialog } from "./components/add-identity-dialog";
import { AnalysisStepper } from "./components/analysis-stepper";
import { BrandIdentityHeader } from "./components/brand-identity-header";
import { BrandIdentityTabs } from "./components/brand-identity-tabs";
import { EmptyBrandIdentityState } from "./components/empty-brand-identity-state";
import { VoiceSelector } from "./components/voice-selector";
import { BrandIdentityPageSkeleton } from "./skeleton";
import type {
  BrandFormInitialData,
  PageClientProps,
} from "./types/brand-identity";
import { sanitizeBrandUrlInput } from "./utils/brand-identity";

const TAB_VALUES = ["identity", "references", "sitemap"] as const;

interface BrandIdentityUiState {
  addIdentityOpen: boolean;
  addReferenceOpen: boolean;
  addSitemapOpen: boolean;
  deleteTargetVoiceId: string | null;
  isSaving: boolean;
  lastSavedAtMs: number | null;
  relativeTimeNow: number;
  storedVoiceId: string | null;
  url: string;
}

type BrandIdentityUiAction =
  | { type: "set-add-identity-open"; open: boolean }
  | { type: "set-add-reference-open"; open: boolean }
  | { type: "set-add-sitemap-open"; open: boolean }
  | { type: "set-delete-target-voice-id"; voiceId: string | null }
  | { type: "set-is-saving"; isSaving: boolean }
  | { type: "set-last-saved-at-ms"; savedAtMs: number | null }
  | { type: "set-relative-time-now"; now: number }
  | { type: "set-stored-voice-id"; voiceId: string | null }
  | { type: "set-url"; url: string };

const initialUiState: BrandIdentityUiState = {
  addIdentityOpen: false,
  addReferenceOpen: false,
  addSitemapOpen: false,
  deleteTargetVoiceId: null,
  isSaving: false,
  lastSavedAtMs: null,
  relativeTimeNow: Date.now(),
  storedVoiceId: null,
  url: "",
};

function brandIdentityUiReducer(
  state: BrandIdentityUiState,
  action: BrandIdentityUiAction
): BrandIdentityUiState {
  switch (action.type) {
    case "set-add-identity-open":
      return { ...state, addIdentityOpen: action.open };
    case "set-add-reference-open":
      return { ...state, addReferenceOpen: action.open };
    case "set-add-sitemap-open":
      return { ...state, addSitemapOpen: action.open };
    case "set-delete-target-voice-id":
      return { ...state, deleteTargetVoiceId: action.voiceId };
    case "set-is-saving":
      return { ...state, isSaving: action.isSaving };
    case "set-last-saved-at-ms":
      return { ...state, lastSavedAtMs: action.savedAtMs };
    case "set-relative-time-now":
      return { ...state, relativeTimeNow: action.now };
    case "set-stored-voice-id":
      return { ...state, storedVoiceId: action.voiceId };
    case "set-url":
      return { ...state, url: action.url };
    default:
      return state;
  }
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const { data, isPending: isPendingSettings } =
    useBrandSettings(organizationId);
  const lastToastError = useRef<string | null>(null);
  const { progress, startPolling } = useBrandAnalysisProgress(
    organizationId,
    (message) => {
      if (lastToastError.current === message) {
        return;
      }
      lastToastError.current = message;
      toast.error(message);
    },
    () => {
      toast.success("Brand identity saved");
    }
  );
  const analyzeMutation = useAnalyzeBrand(organizationId, startPolling);
  const deleteVoiceMutation = useDeleteBrandVoice(organizationId);
  const setDefaultMutation = useSetDefaultBrandVoice(organizationId);
  const progressError =
    progress.status === "failed" ? progress.error : undefined;

  const voices = data?.voices ?? [];
  const [uiState, dispatchUi] = useReducer(
    brandIdentityUiReducer,
    initialUiState
  );
  const [activeVoiceId, setActiveVoiceId] = useQueryState(
    "voice",
    parseAsString
  );
  const [activeTab, setActiveTab] = useQueryState(
    "view",
    parseAsStringLiteral(TAB_VALUES).withDefault("identity")
  );
  const [newIdentityParam, setNewIdentityParam] = useQueryState("new");
  const isAddIdentityOpen =
    uiState.addIdentityOpen || Boolean(newIdentityParam);

  const handleAddIdentityOpenChange = (open: boolean) => {
    dispatchUi({ type: "set-add-identity-open", open });
    if (!open && newIdentityParam) {
      setNewIdentityParam(null);
    }
  };

  useEffect(() => {
    if (organizationId) {
      dispatchUi({
        type: "set-stored-voice-id",
        voiceId: readStoredBrandIdentityId(organizationId),
      });
    }
  }, [organizationId]);

  useHotkey(
    "C",
    () => {
      if (activeTab === "identity") {
        dispatchUi({ type: "set-add-identity-open", open: true });
      } else if (activeTab === "references") {
        dispatchUi({ type: "set-add-reference-open", open: true });
      } else {
        dispatchUi({ type: "set-add-sitemap-open", open: true });
      }
    },
    {
      enabled: !(
        isAddIdentityOpen ||
        uiState.addReferenceOpen ||
        uiState.addSitemapOpen
      ),
    }
  );

  const selectedVoice = findSelectedBrandIdentity(
    voices,
    activeVoiceId,
    uiState.storedVoiceId
  );

  const handleSelectVoice = (voiceId: string) => {
    writeStoredBrandIdentityId(organizationId, voiceId);
    dispatchUi({ type: "set-stored-voice-id", voiceId });
    setActiveVoiceId(voiceId);
  };

  const deleteTargetVoice = uiState.deleteTargetVoiceId
    ? voices.find((v) => v.id === uiState.deleteTargetVoiceId)
    : null;

  const { data: affectedData, isLoading: isLoadingAffected } =
    useBrandVoiceAffectedTriggers(
      organizationId,
      uiState.deleteTargetVoiceId ?? "",
      !!uiState.deleteTargetVoiceId &&
        !!deleteTargetVoice &&
        !deleteTargetVoice.isDefault
    );

  const { data: referencesData } = useReferences(
    organizationId,
    selectedVoice?.id ?? ""
  );
  const referenceCount = referencesData?.references.length ?? 0;

  const { data: sitemapsData } = useSitemaps(
    organizationId,
    selectedVoice?.id ?? ""
  );
  const sitemapCount = sitemapsData?.sitemaps.length ?? 0;
  const selectedVoiceId = selectedVoice?.id;
  const selectedVoiceUpdatedAt = selectedVoice?.updatedAt;
  const effectiveUrl = uiState.url.trim();

  useEffect(() => {
    if (!selectedVoiceId || !selectedVoiceUpdatedAt) {
      dispatchUi({ type: "set-last-saved-at-ms", savedAtMs: null });
      return;
    }

    dispatchUi({
      type: "set-last-saved-at-ms",
      savedAtMs: new Date(selectedVoiceUpdatedAt).getTime(),
    });
  }, [selectedVoiceId, selectedVoiceUpdatedAt]);

  useEffect(() => {
    if (
      activeTab !== "identity" ||
      uiState.isSaving ||
      !uiState.lastSavedAtMs
    ) {
      return;
    }

    dispatchUi({ type: "set-relative-time-now", now: Date.now() });
    const interval = window.setInterval(() => {
      dispatchUi({ type: "set-relative-time-now", now: Date.now() });
    }, 10_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeTab, uiState.isSaving, uiState.lastSavedAtMs]);

  const triggerAnalysis = async (rawUrl: string, voiceId?: string) => {
    let urlToAnalyze = rawUrl.trim();
    if (!urlToAnalyze) {
      toast.error("Please enter a website URL");
      return;
    }

    if (!urlToAnalyze.startsWith("https://")) {
      urlToAnalyze = `https://${urlToAnalyze}`;
    }

    const parseRes = z.url().safeParse(urlToAnalyze);
    if (!parseRes.success) {
      toast.error("Please enter a valid website URL");
      return;
    }

    try {
      lastToastError.current = null;
      await analyzeMutation.mutateAsync({ url: urlToAnalyze, voiceId });
      toast.success("Analysis started");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start analysis";
      if (lastToastError.current !== message) {
        lastToastError.current = message;
        toast.error(message);
      }
    }
  };

  const handleInitialAnalyze = () => triggerAnalysis(effectiveUrl);

  const handleReanalyze = (voiceUrl: string) =>
    triggerAnalysis(voiceUrl, selectedVoice?.id);

  const handleDeleteVoice = async () => {
    if (!deleteTargetVoice || deleteTargetVoice.isDefault) {
      return;
    }

    try {
      const result = await deleteVoiceMutation.mutateAsync(
        deleteTargetVoice.id
      );
      if (activeVoiceId === deleteTargetVoice.id) {
        setActiveVoiceId(null);
      }
      dispatchUi({ type: "set-delete-target-voice-id", voiceId: null });

      const disabledCount =
        (result.disabledSchedules?.length ?? 0) +
        (result.disabledEvents?.length ?? 0);

      if (disabledCount > 0) {
        toast.success(
          `Brand identity deleted. ${disabledCount} ${disabledCount === 1 ? "trigger was" : "triggers were"} disabled.`
        );
      } else {
        toast.success("Brand identity deleted");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete brand identity"
      );
    }
  };

  const handleSetDefault = async () => {
    if (!selectedVoice || selectedVoice.isDefault) {
      return;
    }

    try {
      await setDefaultMutation.mutateAsync(selectedVoice.id);
      toast.success("Default brand identity updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to set default"
      );
    }
  };

  const effectiveProgress =
    analyzeMutation.isPending && progress.status === "idle"
      ? {
          status: "scraping" as const,
          currentStep: 1,
          totalSteps: 3,
        }
      : progress;

  const isAnalyzing =
    analyzeMutation.isPending ||
    progress.status === "scraping" ||
    progress.status === "extracting" ||
    progress.status === "saving";

  const hasVoices = voices.length > 0;

  if (!organizationId || (isPendingSettings && !data)) {
    return <BrandIdentityPageSkeleton />;
  }

  if (!hasVoices) {
    return (
      <EmptyBrandIdentityState
        effectiveProgress={effectiveProgress}
        handleInitialAnalyze={handleInitialAnalyze}
        isAnalyzing={isAnalyzing}
        isPending={analyzeMutation.isPending}
        progressError={progressError}
        setUrl={(url) => dispatchUi({ type: "set-url", url })}
        url={uiState.url}
      />
    );
  }

  if (!selectedVoice) {
    return null;
  }

  const initialData: BrandFormInitialData = {
    name: selectedVoice.name,
    websiteUrl: selectedVoice.websiteUrl
      ? sanitizeBrandUrlInput(selectedVoice.websiteUrl)
      : "",
    companyName: selectedVoice.companyName ?? "",
    companyDescription: selectedVoice.companyDescription ?? "",
    toneProfile: (selectedVoice.toneProfile as ToneProfile) ?? "Professional",
    customTone: selectedVoice.customTone ?? "",
    customInstructions: selectedVoice.customInstructions ?? "",
    useCustomTone: Boolean(selectedVoice.customTone),
    audience: selectedVoice.audience ?? "",
    language: getValidLanguage(selectedVoice.language),
  };
  let saveStatusText = "Saved just now";

  if (uiState.isSaving) {
    saveStatusText = "Saving...";
  } else if (uiState.lastSavedAtMs) {
    saveStatusText = formatRelativeTime(
      new Date(uiState.lastSavedAtMs),
      uiState.relativeTimeNow
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <BrandIdentityHeader
          activeTab={activeTab}
          onAddIdentity={() =>
            dispatchUi({ type: "set-add-identity-open", open: true })
          }
          onAddReference={() =>
            dispatchUi({ type: "set-add-reference-open", open: true })
          }
          onAddSitemap={() =>
            dispatchUi({ type: "set-add-sitemap-open", open: true })
          }
        />

        <VoiceSelector
          activeVoiceId={selectedVoice.id}
          affectedEvents={affectedData?.affectedEvents ?? []}
          affectedSchedules={affectedData?.affectedSchedules ?? []}
          isDeleteDialogOpen={!!uiState.deleteTargetVoiceId}
          isDeleting={deleteVoiceMutation.isPending}
          isLoadingAffected={isLoadingAffected}
          isReanalyzing={analyzeMutation.isPending}
          isSettingDefault={setDefaultMutation.isPending}
          onDelete={handleDeleteVoice}
          onDeleteDialogChange={(open) => {
            if (!open) {
              dispatchUi({
                type: "set-delete-target-voice-id",
                voiceId: null,
              });
            }
          }}
          onReanalyze={handleReanalyze}
          onRequestDelete={(voiceId) =>
            dispatchUi({ type: "set-delete-target-voice-id", voiceId })
          }
          onSelect={handleSelectVoice}
          onSetDefault={handleSetDefault}
          organizationId={organizationId}
          voices={voices}
        />

        <AddIdentityDialog
          onCreated={(voice) => handleSelectVoice(voice.id)}
          onOpenChange={handleAddIdentityOpenChange}
          open={isAddIdentityOpen}
          organizationId={organizationId}
          startPolling={startPolling}
        />

        {(isAnalyzing || progressError) && (
          <Alert variant={progressError ? "destructive" : "default"}>
            <AlertTitle>
              {progressError
                ? "Brand analysis failed"
                : "Brand analysis is running"}
            </AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                {progressError
                  ? progressError
                  : "We are extracting the website details now. The form updates automatically as soon as the analysis finishes."}
              </p>
              {isAnalyzing && <AnalysisStepper progress={effectiveProgress} />}
            </AlertDescription>
          </Alert>
        )}

        <BrandIdentityTabs
          activeTab={activeTab}
          addReferenceOpen={uiState.addReferenceOpen}
          addSitemapOpen={uiState.addSitemapOpen}
          initialData={initialData}
          onActiveTabChange={setActiveTab}
          onAddReferenceOpenChange={(open) =>
            dispatchUi({ type: "set-add-reference-open", open })
          }
          onAddSitemapOpenChange={(open) =>
            dispatchUi({ type: "set-add-sitemap-open", open })
          }
          onSavedAtChange={(savedAt) =>
            dispatchUi({
              type: "set-last-saved-at-ms",
              savedAtMs: savedAt.getTime(),
            })
          }
          onSavingChange={(isSaving) =>
            dispatchUi({ type: "set-is-saving", isSaving })
          }
          organizationId={organizationId}
          referenceCount={referenceCount}
          saveStatusText={saveStatusText}
          sitemapCount={sitemapCount}
          voiceId={selectedVoice.id}
          voiceWebsiteUrl={selectedVoice.websiteUrl}
        />
      </div>
    </PageContainer>
  );
}
