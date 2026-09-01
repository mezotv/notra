import type {
  GeoBrandSearchResult,
  GeoCompetitor,
  GeoDiscoveredPrompt,
  GeoWebsiteDiscovery,
} from "@notra/geo-core/types/geo";
import type * as z from "zod";

import type { ONBOARDING_HEARD_ABOUT_NOTRA_SOURCES } from "@/constants/onboarding";
import type { onboardingWorkspaceSchema } from "@/schemas/onboarding/workspace";

export type OnboardingHeardAboutNotraSource =
  (typeof ONBOARDING_HEARD_ABOUT_NOTRA_SOURCES)[number];

export interface OnboardingAttributionValue {
  heardAboutNotraSource: OnboardingHeardAboutNotraSource | "" | null;
  heardAboutNotraOther?: string | null;
}

export type OnboardingWorkspaceInput = z.infer<
  typeof onboardingWorkspaceSchema
>;

export interface PricingClientProps {
  slug: string;
}

export interface OnboardingExistingOrg {
  heardAboutNotraOther: string | null;
  heardAboutNotraSource: string | null;
  id: string;
  logo: string | null;
  slug: string;
  name: string;
}

export interface WorkspaceFormProps {
  existingOrg?: OnboardingExistingOrg;
}

export interface OnboardingSplitLayoutProps {
  children: React.ReactNode;
}

export interface OnboardingProgressProps {
  current: number;
}

export interface VisibilityFormProps {
  organizationId: string;
  projectId?: string;
  websiteUrl: string;
  companyName: string | null;
  nextHref: string;
  skipHref: string;
  inOnboardingFlow: boolean;
}

export interface VisibilityReviewProps {
  organizationId: string;
  websiteUrl: string;
  discovery: GeoWebsiteDiscovery | null;
  fallbackCompanyName: string;
  nextHref: string;
  skipHref: string;
}

export interface CompetitorsFormProps {
  organizationId: string;
  projectId?: string;
  domain: string | null;
  companyName: string;
  nextHref: string;
  inOnboardingFlow: boolean;
}

export interface CompetitorBrandLogoProps {
  name: string;
  domain: string | null;
  logo: string | null;
  className?: string;
}

export interface CompetitorChoiceRowProps {
  name: string;
  domain: string | null;
  description?: string | null;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export type CompetitorsPickerProps = Omit<
  CompetitorsFormProps,
  "projectId" | "inOnboardingFlow" | "companyName"
>;

export interface CompetitorSearchProps {
  organizationId: string;
  ownDomain: string | null;
  selected: readonly GeoCompetitor[];
  disabled: boolean;
  onAdd: (result: GeoBrandSearchResult) => void;
}

export interface VisibilityBrandDraft {
  companyName: string;
  aliases: readonly string[];
  prompts: readonly GeoDiscoveredPrompt[];
}

export interface OnboardingGeoPageProps {
  searchParams: Promise<{ project?: string | string[] }>;
}

export interface OrgLogoFieldProps {
  disabled?: boolean;
  isLoading?: boolean;
  onSelect: (file: File) => void;
  previewUrl: string | null;
}

export interface OnboardingWorkspaceFormValues {
  heardAboutNotraOther: string;
  heardAboutNotraSource: string;
  name: string;
  slug: string;
  websiteUrl: string;
}

export interface SubmitWorkspaceFormArgs {
  existingOrg?: OnboardingExistingOrg;
  logoFile: File | null;
  logoSourceUrl: string | null;
  value: OnboardingWorkspaceFormValues;
}

export type SaveOnboardingAttributionInput = Pick<
  OnboardingWorkspaceInput,
  "heardAboutNotraOther" | "heardAboutNotraSource"
> & {
  organizationId: string;
};

export type SaveOnboardingAttributionResult =
  | { success: true }
  | { success: false; error: string };
