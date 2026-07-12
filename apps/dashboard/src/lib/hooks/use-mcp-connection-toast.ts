"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { MCP_OAUTH_ERROR_MESSAGES } from "@/constants/mcp";

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
