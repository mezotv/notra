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
    description: "The server is open. No credentials needed.",
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

export const MCP_OAUTH_ERROR_MESSAGES: Record<string, string> = {
  mcp_oauth_denied: "The authorization was canceled.",
  mcp_oauth_failed: "The authorization failed. Try connecting again.",
  mcp_oauth_invalid_callback:
    "The authorization link is invalid or expired. Try connecting again.",
  mcp_oauth_refresh_token_required:
    "The server did not provide a refresh token, so it cannot stay connected.",
  mcp_oauth_session_required: "Log in and try connecting again.",
};

export const MCP_CONNECTED_TOAST = "Connected. Reading tools from the server.";
