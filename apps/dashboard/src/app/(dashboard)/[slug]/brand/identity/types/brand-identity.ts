import type { SupportedLanguage } from "@/constants/languages";
import type { ToneProfile } from "@/schemas/brand";
import type { BrandSettings } from "@/types/hooks/brand-analysis";

export interface PageClientProps {
  organizationSlug: string;
}

export interface ModalContentProps {
  isPendingSettings: boolean;
  isAnalyzing: boolean;
  progress: { status: string; currentStep: number };
  url: string;
  setUrl: (url: string) => void;
  handleAnalyze: () => void;
  isPending: boolean;
  inlineError?: string;
}

export interface VoiceSelectorProps {
  voices: BrandSettings[];
  activeVoiceId: string;
  onSelect: (id: string) => void;
}

export interface AddIdentityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onCreated: (voice: BrandSettings) => void;
  startPolling: () => void;
}

export interface BrandFormInitialData {
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
}

export interface BrandFormProps {
  organizationId: string;
  voiceId: string;
  initialData: BrandFormInitialData;
  isDefault: boolean;
  onReanalyze: (url: string) => void;
  isReanalyzing: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  onSetDefault: () => void;
  isSettingDefault: boolean;
}

export type StepIconState = "pending" | "active" | "completed";
