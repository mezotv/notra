export interface OnboardingSuggestionsProps {
  organizationId: string;
  type: "schedule_automation" | "event_automation";
  onCreate: (suggestionId: string) => void;
}

export interface SuggestionDetails {
  description: string | null;
  evidence: string | null;
  id: string;
  title: string;
  type: OnboardingSuggestionsProps["type"];
}

export interface SuggestionDetailsSheetProps {
  dismissing: boolean;
  onCreate: () => void;
  onDismiss: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  suggestion: SuggestionDetails;
}
