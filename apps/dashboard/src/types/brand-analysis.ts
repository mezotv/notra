import type { ProgressStatus } from "@/types/hooks/brand-analysis";

export interface DefaultBrandSettingsData {
  websiteUrl: string;
  companyName: string;
  companyDescription: string;
  toneProfile: string;
  customTone: string | null;
  audience: string;
  language: string;
}

export type BrandAnalysisStep = Extract<
  ProgressStatus,
  "scraping" | "extracting" | "saving"
>;

export interface QueueBrandAnalysisInput {
  organizationId: string;
  websiteUrl: string;
  name?: string;
}

export interface QueueBrandAnalysisResult {
  jobId: string;
  brandIdentityId: string;
}

export interface DispatchBrandAnalysisInput {
  organizationId: string;
  websiteUrl: string;
  brandIdentityId: string;
  jobId: string;
}

export interface InsertBrandIdentityInput {
  organizationId: string;
  brandName: string;
  websiteUrl: string;
}

export interface TriggerOnboardingBrandAnalysisInput {
  organizationId: string;
  websiteUrl: string;
  name?: string;
}
