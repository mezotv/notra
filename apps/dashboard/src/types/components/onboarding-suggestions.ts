export interface OnboardingSuggestionsProps {
  organizationId: string;
  type: "schedule_automation" | "event_automation";
  onCreate: (suggestionId: string) => void;
}
