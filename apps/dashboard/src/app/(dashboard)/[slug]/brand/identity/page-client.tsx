"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { useRef, useState } from "react";
import { toast } from "sonner";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { getValidLanguage, type ToneProfile } from "@/schemas/brand";
import {
  useAnalyzeBrand,
  useBrandAnalysisProgress,
  useBrandSettings,
  useDeleteBrandVoice,
  useSetDefaultBrandVoice,
} from "../../../../../lib/hooks/use-brand-analysis";
import { AddIdentityDialog } from "./components/add-identity-dialog";
import { BrandForm } from "./components/brand-form";
import { ModalContent } from "./components/modal-content";
import { VoiceSelector } from "./components/voice-selector";
import { BrandIdentityPageSkeleton } from "./skeleton";
import type {
  BrandFormInitialData,
  PageClientProps,
} from "./types/brand-identity";
import {
  getModalDescription,
  getModalTitle,
  sanitizeBrandUrlInput,
} from "./utils/brand-identity";

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
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);
  const [addIdentityOpen, setAddIdentityOpen] = useState(false);

  const selectedVoice =
    voices.find((v) => v.id === activeVoiceId) ??
    voices.find((v) => v.isDefault) ??
    voices[0];

  const [url, setUrl] = useState("");
  const effectiveUrl = url.trim();

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
    if (!selectedVoice || selectedVoice.isDefault) {
      return;
    }

    try {
      await deleteVoiceMutation.mutateAsync(selectedVoice.id);
      setActiveVoiceId(null);
      toast.success("Brand identity deleted");
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
      <PageContainer
        className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6"
        variant="compact"
      >
        <div className="w-full px-4 lg:px-6">
          <div className="relative min-h-125">
            <div className="pointer-events-none blur-sm">
              <div className="mb-6 space-y-1">
                <h1 className="font-bold text-3xl tracking-tight">
                  Brand Identity
                </h1>
                <p className="text-muted-foreground">
                  Configure your brand identity and tone
                </p>
              </div>
              <div className="space-y-8">
                <div className="h-16 w-80 rounded-lg border bg-muted/20" />
                <div className="h-16 w-80 rounded-lg border bg-muted/20" />
                <div className="h-32 w-full max-w-xl rounded-lg border bg-muted/20" />
                <div className="h-24 w-80 rounded-lg border bg-muted/20" />
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <Card className="w-full max-w-md border-border/50 shadow-xs">
                <CardHeader className="text-center">
                  <CardTitle>
                    {getModalTitle(
                      false,
                      isAnalyzing,
                      effectiveProgress.status
                    )}
                  </CardTitle>
                  <CardDescription>
                    {getModalDescription(
                      false,
                      isAnalyzing,
                      effectiveProgress.status,
                      progress.error
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ModalContent
                    handleAnalyze={handleInitialAnalyze}
                    inlineError={progressError}
                    isAnalyzing={isAnalyzing}
                    isPending={analyzeMutation.isPending}
                    isPendingSettings={false}
                    progress={effectiveProgress}
                    setUrl={setUrl}
                    url={url}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
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

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">
              Brand Identity
            </h1>
            <p className="text-muted-foreground">
              Configure your brand identity and tone
            </p>
          </div>
          <Button onClick={() => setAddIdentityOpen(true)} size="sm">
            <HugeiconsIcon className="size-4" icon={Add01Icon} />
            Add Identity
          </Button>
        </div>

        <VoiceSelector
          activeVoiceId={selectedVoice.id}
          onSelect={setActiveVoiceId}
          voices={voices}
        />

        <AddIdentityDialog
          onCreated={(voice) => setActiveVoiceId(voice.id)}
          onOpenChange={setAddIdentityOpen}
          open={addIdentityOpen}
          organizationId={organizationId}
          startPolling={startPolling}
        />

        <BrandForm
          initialData={initialData}
          isDefault={selectedVoice.isDefault}
          isDeleting={deleteVoiceMutation.isPending}
          isReanalyzing={analyzeMutation.isPending}
          isSettingDefault={setDefaultMutation.isPending}
          key={selectedVoice.id}
          onDelete={handleDeleteVoice}
          onReanalyze={handleReanalyze}
          onSetDefault={handleSetDefault}
          organizationId={organizationId}
          voiceId={selectedVoice.id}
        />
      </div>
    </PageContainer>
  );
}
