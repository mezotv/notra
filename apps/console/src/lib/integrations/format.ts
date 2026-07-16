import { STORE_STATUS_LABELS } from "@/lib/integrations/constants";
import type { McpServer, StoreStatusBadge } from "@/types/integrations";

export function getStoreStatusBadge(server: McpServer): StoreStatusBadge {
  if (server.storeStatus === "live") {
    return server.enabled
      ? { label: "Live", variant: "default" }
      : { label: "Hidden", variant: "secondary" };
  }
  if (server.storeStatus === "rejected") {
    return {
      label: STORE_STATUS_LABELS.rejected,
      variant: "destructive",
    };
  }
  return {
    label: STORE_STATUS_LABELS[server.storeStatus],
    variant: "secondary",
  };
}

export function getAuthTypeLabel(authType: string) {
  if (authType === "oauth") {
    return "OAuth";
  }
  if (authType === "none") {
    return "No auth";
  }
  return "API key";
}

const createdDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatIntegrationDate(iso: string | null) {
  if (!iso) {
    return "n/a";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "n/a";
  }

  return createdDateFormatter.format(date);
}

export function formatDashboardConnectionsLabel(
  githubCount: number,
  linearCount: number
) {
  const parts: string[] = [];
  if (githubCount > 0) {
    parts.push(
      githubCount === 1
        ? "1 GitHub connection"
        : `${githubCount} GitHub connections`
    );
  }
  if (linearCount > 0) {
    parts.push(
      linearCount === 1
        ? "1 Linear connection"
        : `${linearCount} Linear connections`
    );
  }
  return parts.join(" and ");
}
