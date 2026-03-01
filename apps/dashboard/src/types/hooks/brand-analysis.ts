export interface BrandSettings {
  id: string;
  organizationId: string;
  companyName: string | null;
  companyDescription: string | null;
  toneProfile: string | null;
  customTone: string | null;
  customInstructions: string | null;
  audience: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandSettingsResponse {
  settings: BrandSettings | null;
}

export type ProgressStatus =
  | "idle"
  | "scraping"
  | "extracting"
  | "saving"
  | "completed"
  | "failed";

export interface Progress {
  status: ProgressStatus;
  currentStep: number;
  totalSteps: number;
  error?: string;
}

export interface ProgressResponse {
  progress: Progress;
}
