import type { z } from "zod";
import type {
  createMcpServerRequestSchema,
  reviewMcpServerRequestSchema,
  testMcpServerRequestSchema,
  updateMcpServerRequestSchema,
  updateMcpToolPhrasesRequestSchema,
} from "@/schemas/integrations";

export type CreateMcpServerRequest = z.infer<
  typeof createMcpServerRequestSchema
>;

export type UpdateMcpServerRequest = z.infer<
  typeof updateMcpServerRequestSchema
>;

export type UpdateMcpToolPhrasesRequest = z.infer<
  typeof updateMcpToolPhrasesRequestSchema
>;

export type ReviewMcpServerRequest = z.infer<
  typeof reviewMcpServerRequestSchema
>;

export type TestMcpServerRequest = z.infer<typeof testMcpServerRequestSchema>;

export type AuthChoice = "none" | "oauth" | "apikey";

export type ApiKeyStyle = "bearer" | "headers";

export type McpAuthType = "none" | "headers" | "oauth";

export type StoreStatus = "draft" | "pending_review" | "live" | "rejected";

export interface HeaderRow {
  id: string;
  name: string;
  value: string;
}

export interface McpServer {
  id: string;
  name: string;
  url: string;
  description: string | null;
  author: string | null;
  websiteUrl: string | null;
  brandColor: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  bannerUrl: string | null;
  storeStatus: StoreStatus;
  reviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  authType: McpAuthType;
  enabled: boolean;
  headerNames: string[];
  hasHeaders: boolean;
  indexedToolCount: number;
  lastToolSyncAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface McpIntegrationTool {
  id: string;
  serverToolName: string;
  title: string | null;
  description: string | null;
  actionPhrasePresent: string | null;
  actionPhrasePast: string | null;
  isManual?: boolean;
}

export interface ToolPhraseDraft {
  serverToolName: string;
  actionPhrasePresent: string;
  actionPhrasePast: string;
}

export interface PendingReviewIntegration {
  id: string;
  name: string;
  url: string;
  description: string | null;
  author: string | null;
  websiteUrl: string | null;
  brandColor: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  bannerUrl: string | null;
  authType: string;
  tools: McpIntegrationTool[];
  submittedAt: string | null;
  organization: { id: string; name: string; slug: string };
  createdByUser: { id: string; name: string; email: string };
}

export type BrandingAssetKind = "logo-light" | "logo-dark" | "banner";

export type LogoTheme = "light" | "dark";

export interface ToolPhraseImportEntry {
  serverToolName: string;
  actionPhrasePresent?: string | null;
  actionPhrasePast?: string | null;
}

export type ToolPhraseField = "actionPhrasePresent" | "actionPhrasePast";

export interface StoreStatusBadge {
  label: string;
  variant: "default" | "secondary" | "destructive";
}

export interface PendingToolListProps {
  tools: McpIntegrationTool[];
}

export interface ToolChatPreviewProps {
  logoDarkUrl: string | null;
  logoLightUrl: string | null;
  past: string;
  present: string;
  serverName: string;
  serverUrl: string;
  toolName: string;
}

export interface ToolChatPreviewIconProps {
  candidates: string[];
  className?: string;
}

export interface ToolsEditorProps {
  drafts: Record<string, ToolPhraseDraft>;
  oauth: boolean;
  onAddTool: (serverToolName: string) => void;
  onDraftChange: (
    serverToolName: string,
    field: ToolPhraseField,
    value: string
  ) => void;
  onImportTools: (entries: ToolPhraseImportEntry[]) => void;
  onRemoveTool: (serverToolName: string) => void;
  onScan: () => void;
  saving: boolean;
  scanning: boolean;
  serverLogoDarkUrl: string | null;
  serverLogoLightUrl: string | null;
  serverName: string;
  serverUrl: string;
  tools: McpIntegrationTool[];
}
