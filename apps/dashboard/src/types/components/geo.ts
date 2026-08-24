import type { ReactNode } from "react";
import type { GeoPromptSuggestion, GeoSuggestionKeyword } from "@/types/geo";
import type { GeoSearchConsoleStatus } from "@/types/google-search-console";

export interface PromptSuggestionsProps {
  organizationId: string;
}

export interface SuggestionStatusRowProps {
  action?: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
  titleId?: string;
}

export interface SuggestionEvidenceProps {
  keywords: GeoSuggestionKeyword[];
}

export interface SuggestionRowProps {
  checking: boolean;
  organizationId: string;
  suggestion: GeoPromptSuggestion;
}

export interface SearchConsoleCardProps {
  organizationId: string;
  callbackPath: string;
}

export interface SearchConsoleHeaderRowProps {
  action?: ReactNode;
  titleId: string;
  onDismiss?: () => void;
}

export interface SearchConsoleConnectActionProps {
  organizationId: string;
  callbackPath: string;
  configured: boolean;
  reauth: boolean;
}

export interface SearchConsoleSelectSiteStateProps {
  organizationId: string;
  status: GeoSearchConsoleStatus;
}

export interface SearchConsoleConnectedStateProps {
  organizationId: string;
  status: GeoSearchConsoleStatus;
}

export interface GeoUpgradeGateProps {
  slug: string;
  children: ReactNode;
}

export interface GeoUpgradeDialogProps {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
