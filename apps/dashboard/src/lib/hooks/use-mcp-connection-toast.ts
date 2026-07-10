"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const MCP_OAUTH_ERROR_MESSAGES: Record<string, string> = {
  mcp_oauth_denied: "MCP authorization was canceled.",
  mcp_oauth_failed: "MCP authorization failed. Try connecting again.",
  mcp_oauth_invalid_callback:
    "The MCP authorization link is invalid or expired.",
  mcp_oauth_refresh_token_required:
    "This server did not provide a refresh token, so it cannot stay connected.",
  mcp_oauth_session_required:
    "Sign in again before connecting this MCP server.",
};

export function useMcpConnectionToast() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const connected = url.searchParams.get("mcpConnected");
    const error = url.searchParams.get("error");
    if (connected === "true") {
      toast.success("MCP server connected with OAuth");
    }

    const message = error ? MCP_OAUTH_ERROR_MESSAGES[error] : undefined;
    if (message) {
      toast.error(message);
    }
    if (connected === "true" || message) {
      url.searchParams.delete("mcpConnected");
      url.searchParams.delete("error");
      window.history.replaceState(null, "", url);
    }
  }, []);
}
