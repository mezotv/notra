export type McpTestStatus = "idle" | "testing" | "success" | "error";

export interface McpConnectionTestStatusProps {
  message: string;
  status: McpTestStatus;
}

export type McpServerFormApi = ReturnType<typeof useMcpServerForm>;

export interface McpAuthenticationFieldsProps {
  form: McpServerFormApi;
  headerRowIds: string[];
  invalidateTestResult: () => void;
  setHeaderRowIds: Dispatch<SetStateAction<string[]>>;
}

export interface McpServerDetailsFieldsProps {
  form: McpServerFormApi;
  invalidateTestResult: () => void;
}

export interface McpDialogFooterProps {
  authType: "none" | "headers" | "oauth";
  canSubmit: boolean;
  isCreating: boolean;
  isRedirecting: boolean;
  isTesting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onTest: () => void;
}

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

import type { Dispatch, SetStateAction } from "react";
import type { useMcpServerForm } from "@/lib/hooks/use-mcp-server-form";
