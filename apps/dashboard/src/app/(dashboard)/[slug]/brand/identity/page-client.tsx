"use client";

import {
  Add01Icon,
  Delete02Icon,
  MinusSignIcon,
  Refresh01Icon,
  StarIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@notra/ui/components/ui/combobox";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@notra/ui/components/ui/stepper";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useForm } from "@tanstack/react-form";
import { useAsyncDebouncedCallback } from "@tanstack/react-pacer";
import { Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/constants/languages";
import { getValidLanguage, type ToneProfile } from "@/schemas/brand";
import type { BrandSettings } from "@/types/hooks/brand-analysis";
import {
  useAnalyzeBrand,
  useBrandAnalysisProgress,
  useBrandSettings,
  useCreateBrandVoice,
  useDeleteBrandVoice,
  useSetDefaultBrandVoice,
  useUpdateBrandSettings,
} from "../../../../../lib/hooks/use-brand-analysis";
import { BrandIdentityPageSkeleton } from "./skeleton";

const AUTO_SAVE_DELAY = 1500;

interface PageClientProps {
  organizationSlug: string;
}

const ANALYSIS_STEPS = [
  { value: "scraping", label: "Scraping" },
  { value: "extracting", label: "Extracting" },
  { value: "saving", label: "Saving" },
];

const TONE_OPTIONS: { value: ToneProfile; label: string }[] = [
  { value: "Conversational", label: "Conversational" },
  { value: "Professional", label: "Professional" },
  { value: "Casual", label: "Casual" },
  { value: "Formal", label: "Formal" },
];

const LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES;

function getStepperValue(status: string, currentStep: number): string {
  if (status === "idle" || status === "failed") {
    return "";
  }
  if (status === "completed") {
    return "saving";
  }
  const stepIndex = Math.max(0, currentStep - 1);
  return ANALYSIS_STEPS[stepIndex]?.value ?? ANALYSIS_STEPS[0]?.value ?? "";
}

function getModalTitle(
  isPendingSettings: boolean,
  isAnalyzing: boolean,
  status: string
): string {
  if (isPendingSettings) {
    return "Loading...";
  }
  if (isAnalyzing) {
    return "Analyzing Website";
  }
  if (status === "failed") {
    return "Analysis Failed";
  }
  return "Add Your Brand";
}

function getModalDescription(
  isPendingSettings: boolean,
  isAnalyzing: boolean,
  status: string,
  error?: string
): string {
  if (isPendingSettings) {
    return "Checking your brand settings";
  }
  if (isAnalyzing) {
    return "Please wait while we extract your brand information";
  }
  if (status === "failed") {
    return error ?? "Something went wrong";
  }
  return "Enter your website URL to automatically extract your brand identity";
}

interface ModalContentProps {
  isPendingSettings: boolean;
  isAnalyzing: boolean;
  progress: { status: string; currentStep: number };
  url: string;
  setUrl: (url: string) => void;
  handleAnalyze: () => void;
  isPending: boolean;
  inlineError?: string;
}

const FULL_URL_REGEX = /^https?:\/\//i;

const sanitizeBrandUrlInput = (value: string) =>
  value.trim().replace(FULL_URL_REGEX, "");

type StepIconState = "pending" | "active" | "completed";

const STEP_ICONS: Record<StepIconState, () => React.ReactNode> = {
  completed: () => <HugeiconsIcon className="size-4" icon={Tick02Icon} />,
  active: () => <Loader2Icon className="size-4 animate-spin" />,
  pending: () => (
    <HugeiconsIcon
      className="size-4 text-muted-foreground"
      icon={MinusSignIcon}
    />
  ),
};

function getStepIconState(
  currentStep: number,
  stepNumber: number
): StepIconState {
  if (currentStep < stepNumber) {
    return "pending";
  }
  if (currentStep > stepNumber) {
    return "completed";
  }
  return "active";
}

function ModalContent({
  isPendingSettings,
  isAnalyzing,
  progress,
  url,
  setUrl,
  handleAnalyze,
  isPending,
  inlineError,
}: ModalContentProps) {
  if (isPendingSettings) {
    return (
      <div className="flex justify-center py-4">
        <Loader2Icon className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <Stepper
        nonInteractive
        value={getStepperValue(progress.status, progress.currentStep)}
      >
        <StepperList>
          {ANALYSIS_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const iconState = getStepIconState(
              progress.currentStep,
              stepNumber
            );
            return (
              <StepperItem
                completed={progress.currentStep > stepNumber}
                key={step.value}
                value={step.value}
              >
                <StepperTrigger className="gap-2 px-2">
                  <StepperIndicator className="size-8">
                    {STEP_ICONS[iconState]()}
                  </StepperIndicator>
                  <StepperTitle className="text-sm">{step.label}</StepperTitle>
                </StepperTrigger>
                <StepperSeparator className="h-0.5" />
              </StepperItem>
            );
          })}
        </StepperList>
      </Stepper>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div
          className={`flex w-full flex-row items-center overflow-hidden rounded-lg border bg-background transition-all focus-within:ring-2 focus-within:ring-ring/20 ${progress.status === "failed" ? "border-destructive" : "border-input"}`}
        >
          <span className="flex h-10 items-center border-input border-r bg-muted/50 px-3 text-muted-foreground text-sm">
            https://
          </span>
          <input
            aria-label="Website URL"
            className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            disabled={isPending}
            id="brand-url-input"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isPending) {
                handleAnalyze();
              }
            }}
            placeholder="example.com"
            type="text"
            value={url}
          />
        </div>
        <Button
          className="h-10 px-6"
          disabled={isPending}
          onClick={handleAnalyze}
        >
          {isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Analyzing</span>
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </div>
      {progress.status === "failed" && (
        <p className="text-center text-destructive text-sm">
          Try again with a different URL
        </p>
      )}
      {inlineError && (
        <p className="text-center text-destructive text-sm">{inlineError}</p>
      )}
    </div>
  );
}

interface VoiceSelectorProps {
  voices: BrandSettings[];
  activeVoiceId: string;
  onSelect: (id: string) => void;
}

function VoiceSelector({
  voices,
  activeVoiceId,
  onSelect,
}: VoiceSelectorProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {voices.map((voice) => (
        <button
          className={`flex min-w-[10rem] shrink-0 flex-col gap-1.5 rounded-lg border px-4 py-3 text-left transition-colors ${
            voice.id === activeVoiceId
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          }`}
          key={voice.id}
          onClick={() => onSelect(voice.id)}
          type="button"
        >
          <span className="font-medium text-sm leading-tight">
            {voice.name}
          </span>
          <div className="flex items-center gap-1.5">
            {voice.toneProfile && (
              <Badge className="text-xs" variant="secondary">
                {voice.toneProfile}
              </Badge>
            )}
            {voice.isDefault && (
              <Badge className="text-xs" variant="outline">
                Default
              </Badge>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

interface AddVoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onCreated: (voice: BrandSettings) => void;
  startPolling: () => void;
}

function AddVoiceDialog({
  open,
  onOpenChange,
  organizationId,
  onCreated,
  startPolling,
}: AddVoiceDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const createMutation = useCreateBrandVoice(organizationId);
  const analyzeMutation = useAnalyzeBrand(organizationId, startPolling);

  const isSubmitting = createMutation.isPending || analyzeMutation.isPending;

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName) {
      toast.error("Please enter a voice name");
      return;
    }

    if (!trimmedUrl) {
      toast.error("Please enter a website URL");
      return;
    }

    let websiteUrl = trimmedUrl;
    if (!trimmedUrl.startsWith("https://")) {
      websiteUrl = `https://${trimmedUrl}`;
    }

    const parseRes = z.url().safeParse(websiteUrl);
    if (!parseRes.success) {
      toast.error("Please enter a valid website URL");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        name: trimmedName,
        websiteUrl,
      });
      const voice = result.voice;
      onCreated(voice);
      onOpenChange(false);
      setTimeout(() => {
        setName("");
        setUrl("");
      }, 300);

      try {
        await analyzeMutation.mutateAsync({
          url: websiteUrl,
          voiceId: voice.id,
        });
        toast.success("Voice created, analysis started");
      } catch {
        toast.error(
          "Voice created, but failed to start analysis. You can re-analyze from the voice settings."
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create voice"
      );
    }
  };

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add Brand Voice</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Create a new brand voice with a different tone, audience, or
            language for your content.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="voice-name">Name</Label>
            <Input
              autoFocus
              id="voice-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing, Technical, Internal"
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voice-url">Website</Label>
            <div className="flex w-full flex-row items-center overflow-hidden rounded-lg border border-input bg-background transition-all focus-within:ring-2 focus-within:ring-ring/20">
              <span className="flex h-10 items-center border-input border-r bg-muted/50 px-3 text-muted-foreground text-sm">
                https://
              </span>
              <input
                className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                id="voice-url"
                onChange={(e) => setUrl(sanitizeBrandUrlInput(e.target.value))}
                placeholder="example.com"
                type="text"
                value={url}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              We'll analyze this website to extract your brand identity.
            </p>
          </div>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              disabled={isSubmitting}
              render={
                <Button
                  className="w-full justify-center sm:w-auto"
                  variant="outline"
                />
              }
            >
              Cancel
            </ResponsiveDialogClose>
            <Button
              className="w-full justify-center sm:w-auto"
              disabled={!name.trim() || !url.trim() || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating..." : "Create Voice"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

interface BrandFormProps {
  organizationId: string;
  voiceId: string;
  initialData: {
    name: string;
    websiteUrl: string;
    companyName: string;
    companyDescription: string;
    toneProfile: ToneProfile;
    customTone: string;
    customInstructions: string;
    useCustomTone: boolean;
    audience: string;
    language: SupportedLanguage;
  };
  isDefault: boolean;
  onReanalyze: (url: string) => void;
  isReanalyzing: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  onSetDefault: () => void;
  isSettingDefault: boolean;
}

function BrandForm({
  organizationId,
  voiceId,
  initialData,
  isDefault,
  onReanalyze,
  isReanalyzing,
  onDelete,
  isDeleting,
  onSetDefault,
  isSettingDefault,
}: BrandFormProps) {
  const updateMutation = useUpdateBrandSettings(organizationId);
  const lastSavedData = useRef<string>(JSON.stringify(initialData));
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const debouncedSave = useAsyncDebouncedCallback(
    async (values: typeof initialData) => {
      const { useCustomTone: _, websiteUrl: rawUrl, ...valuesToSave } = values;
      const trimmedUrl = rawUrl.trim();
      const websiteUrl =
        trimmedUrl && !trimmedUrl.startsWith("https://")
          ? `https://${trimmedUrl}`
          : trimmedUrl || null;
      await updateMutation.mutateAsync({
        ...valuesToSave,
        id: voiceId,
        websiteUrl,
      });
      lastSavedData.current = JSON.stringify(values);
      toast.success("Changes saved");
    },
    { wait: AUTO_SAVE_DELAY }
  );

  const form = useForm({
    defaultValues: initialData,
    onSubmit: async () => {},
    listeners: {
      onChange: ({ formApi }) => {
        const currentValues = formApi.state.values;
        const currentData = JSON.stringify(currentValues);

        if (currentData === lastSavedData.current) {
          return;
        }

        if (currentValues.useCustomTone && !currentValues.customTone.trim()) {
          return;
        }

        debouncedSave(currentValues).catch((error) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to save changes"
          );
        });
      },
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TitleCard
        action={
          <div className="flex items-center gap-2">
            {!isDefault && (
              <>
                <Button
                  disabled={isSettingDefault}
                  onClick={onSetDefault}
                  size="sm"
                  variant="outline"
                >
                  <HugeiconsIcon icon={StarIcon} size={14} />
                  Set as default
                </Button>
                <Button
                  disabled={isDeleting}
                  onClick={() => setDeleteDialogOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                  Delete
                </Button>
                <ResponsiveDialog
                  onOpenChange={setDeleteDialogOpen}
                  open={isDeleteDialogOpen}
                >
                  <ResponsiveDialogContent className="sm:max-w-md">
                    <ResponsiveDialogHeader>
                      <ResponsiveDialogTitle>
                        Delete voice?
                      </ResponsiveDialogTitle>
                      <ResponsiveDialogDescription>
                        This removes this brand voice and its saved profile
                        settings. This action cannot be undone.
                      </ResponsiveDialogDescription>
                    </ResponsiveDialogHeader>
                    <ResponsiveDialogFooter>
                      <ResponsiveDialogClose
                        disabled={isDeleting}
                        render={
                          <Button
                            className="w-full justify-center sm:w-auto"
                            variant="outline"
                          />
                        }
                      >
                        Cancel
                      </ResponsiveDialogClose>
                      <Button
                        className="w-full justify-center sm:w-auto"
                        disabled={isDeleting}
                        onClick={() => {
                          onDelete();
                          setDeleteDialogOpen(false);
                        }}
                        variant="destructive"
                      >
                        {isDeleting ? "Deleting..." : "Delete voice"}
                      </Button>
                    </ResponsiveDialogFooter>
                  </ResponsiveDialogContent>
                </ResponsiveDialog>
              </>
            )}
            <form.Subscribe selector={(s) => s.values.websiteUrl}>
              {(websiteUrl) => (
                <Button
                  disabled={isReanalyzing || !websiteUrl.trim()}
                  onClick={() => onReanalyze(websiteUrl)}
                  size="sm"
                  variant="outline"
                >
                  <HugeiconsIcon
                    className={isReanalyzing ? "animate-spin" : ""}
                    icon={Refresh01Icon}
                    size={16}
                  />
                  Re-analyze
                </Button>
              )}
            </form.Subscribe>
          </div>
        }
        heading="Company Profile"
      >
        <div className="space-y-6">
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Voice name</Label>
                <Input
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. Default, Marketing, Technical"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="companyName">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Company name</Label>
                <Input
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Your company name"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="websiteUrl">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Website</Label>
                <div className="flex w-full flex-row items-center overflow-hidden rounded-lg border border-input bg-background transition-all focus-within:ring-2 focus-within:ring-ring/20">
                  <span className="flex h-10 items-center border-input border-r bg-muted/50 px-3 text-muted-foreground text-sm">
                    https://
                  </span>
                  <input
                    className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(sanitizeBrandUrlInput(e.target.value))
                    }
                    placeholder="example.com"
                    type="text"
                    value={field.state.value}
                  />
                </div>
              </div>
            )}
          </form.Field>

          <form.Field name="companyDescription">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Description</Label>
                <Textarea
                  className="min-h-[7.5rem]"
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="A short overview of your company"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
        </div>
      </TitleCard>

      <TitleCard heading="Tone & Language">
        <form.Field name="useCustomTone">
          {(useCustomToneField) => (
            <fieldset className="space-y-4">
              <legend className="sr-only">Tone selection</legend>
              <form.Field name="toneProfile">
                {(toneProfileField) => (
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        checked={!useCustomToneField.state.value}
                        className="peer sr-only"
                        name="toneType"
                        onChange={() => {
                          useCustomToneField.handleChange(false);
                          form.setFieldValue("customTone", "");
                        }}
                        type="radio"
                        value="preset"
                      />
                      <div
                        className={`flex size-5 items-center justify-center rounded-full ${
                          useCustomToneField.state.value
                            ? "border-2 border-muted-foreground/30"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {!useCustomToneField.state.value && (
                          <svg
                            aria-hidden="true"
                            className="size-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M5 13l4 4L19 7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={
                          useCustomToneField.state.value
                            ? "text-muted-foreground text-sm"
                            : "text-sm"
                        }
                      >
                        Tone Profile
                      </span>
                    </label>
                    <Select
                      disabled={useCustomToneField.state.value}
                      onValueChange={(value) => {
                        if (value) {
                          toneProfileField.handleChange(value as ToneProfile);
                        }
                      }}
                      value={toneProfileField.state.value}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <div className="pt-4">
                <form.Field name="customTone">
                  {(customToneField) => (
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          checked={useCustomToneField.state.value}
                          className="peer sr-only"
                          name="toneType"
                          onChange={() => useCustomToneField.handleChange(true)}
                          type="radio"
                          value="custom"
                        />
                        <div
                          className={`flex size-5 items-center justify-center rounded-full ${
                            useCustomToneField.state.value
                              ? "bg-primary text-primary-foreground"
                              : "border-2 border-muted-foreground/30"
                          }`}
                        >
                          {useCustomToneField.state.value && (
                            <svg
                              aria-hidden="true"
                              className="size-3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M5 13l4 4L19 7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm">Custom Tone</span>
                      </label>
                      <Input
                        autoComplete="off"
                        disabled={!useCustomToneField.state.value}
                        id={customToneField.name}
                        onBlur={customToneField.handleBlur}
                        onChange={(e) =>
                          customToneField.handleChange(e.target.value)
                        }
                        placeholder="Add custom tone notes…"
                        value={customToneField.state.value}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            </fieldset>
          )}
        </form.Field>

        <div className="pt-4">
          <form.Field name="language">
            {(field) => (
              <div className="space-y-2">
                <Label>Language</Label>
                <Combobox
                  onValueChange={(value) => {
                    if (value) {
                      field.handleChange(value);
                    }
                  }}
                  value={field.state.value}
                >
                  <ComboboxInput placeholder="Select language..." />
                  <ComboboxContent>
                    <ComboboxList>
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <ComboboxItem key={lang} value={lang}>
                          {lang}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                    <ComboboxEmpty>No language found</ComboboxEmpty>
                  </ComboboxContent>
                </Combobox>
              </div>
            )}
          </form.Field>
        </div>

        <div className="pt-4">
          <form.Field name="customInstructions">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Custom Instructions</Label>
                <Textarea
                  className="min-h-[6.25rem]"
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Add any specific instructions for AI-generated content (e.g., avoid certain phrases, always mention specific features, etc.)"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
        </div>
      </TitleCard>

      <TitleCard className="lg:col-span-2" heading="Target Audience">
        <form.Field name="audience">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Who are you writing for?</Label>
              <Textarea
                className="min-h-[7.5rem]"
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Describe your target audience - their interests, pain points, and what matters to them"
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>
      </TitleCard>
    </div>
  );
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
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);
  const [addVoiceOpen, setAddVoiceOpen] = useState(false);

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
      toast.success("Voice deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete voice"
      );
    }
  };

  const handleSetDefault = async () => {
    if (!selectedVoice || selectedVoice.isDefault) {
      return;
    }

    try {
      await setDefaultMutation.mutateAsync(selectedVoice.id);
      toast.success("Default voice updated");
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
                  Configure your brand identity and tone of voice
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

  const initialData = {
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
              Configure your brand identity and tone of voice
            </p>
          </div>
          <Button onClick={() => setAddVoiceOpen(true)} size="sm">
            <HugeiconsIcon className="size-4" icon={Add01Icon} />
            Add Voice
          </Button>
        </div>

        <VoiceSelector
          activeVoiceId={selectedVoice.id}
          onSelect={setActiveVoiceId}
          voices={voices}
        />

        <AddVoiceDialog
          onCreated={(voice) => setActiveVoiceId(voice.id)}
          onOpenChange={setAddVoiceOpen}
          open={addVoiceOpen}
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
