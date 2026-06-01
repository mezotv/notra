export type McpTestStatus = "idle" | "testing" | "success" | "error";

export interface McpServer {
  id: string;
  name: string;
  url: string;
  description?: string | null;
  headerNames?: string[];
  hasHeaders?: boolean;
  enabled: boolean;
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
}

export interface McpIntegrationCardProps {
  organizationId: string;
  organizationSlug: string;
}
