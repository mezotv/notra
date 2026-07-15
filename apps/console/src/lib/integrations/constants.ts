import type { AuthChoice, StoreStatus } from "@/types/integrations";

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  draft: "Draft",
  pending_review: "In review",
  live: "Live",
  rejected: "Rejected",
};

export const AUTH_CHOICE_OPTIONS: Array<{
  value: AuthChoice;
  label: string;
  description: string;
}> = [
  {
    value: "none",
    label: "None",
    description: "The server is open — no credentials needed.",
  },
  {
    value: "oauth",
    label: "OAuth",
    description: "Users sign in via the server's OAuth flow.",
  },
  {
    value: "apikey",
    label: "API key",
    description: "Requests authenticate with a key or custom headers.",
  },
];

export const LIVE_EDIT_WARNING =
  "This integration is live. Saving edits returns it to pending review, so it leaves the store until an admin approves it again.";
