export type McpTestStatus = "idle" | "testing" | "success" | "error";

export interface McpServer {
  authType: "none" | "headers" | "oauth";
  id: string;
  name: string;
  url: string;
  description?: string | null;
  headerNames?: string[];
  hasHeaders?: boolean;
  enabled: boolean;
  lastToolSyncAt?: string | null;
  toolSyncStatus?: "idle" | "syncing" | "synced" | "error" | string;
  toolSyncError?: string | null;
  indexedToolCount?: number;
  oauthStatus?: "connected" | "reauth_required" | "error" | string | null;
}

export interface AddMcpServerDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  organizationId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export interface McpServerCardProps {
  server: McpServer;
  onToggle?: (id: string, enabled: boolean) => void;
  onDelete?: (id: string) => void;
  onRefreshTools?: (id: string) => void;
  onReauthorize?: (id: string) => void;
  refreshing?: boolean;
  reauthorizing?: boolean;
}

export interface McpIntegrationCardProps {
  organizationId: string;
  organizationSlug: string;
}
