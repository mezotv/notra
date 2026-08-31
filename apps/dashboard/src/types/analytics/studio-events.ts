import type {
  CHAT_ATTACHMENT_SIZE_BUCKETS,
  CHAT_CONTEXT_KINDS,
  CHAT_DRAFT_ACTIONS,
  CHAT_GENERATION_BLOCKED_CODES,
  CHAT_TOOL_APPROVAL_DECISIONS,
  CHAT_TRANSPORTS,
  COMMAND_PALETTE_OPEN_SOURCES,
  COMMAND_PALETTE_RESULT_KINDS,
  CONTENT_CREATE_ENTRIES,
} from "@/constants/studio-analytics";

export type ContentCreateEntry = (typeof CONTENT_CREATE_ENTRIES)[number];

export type ChatAttachmentSizeBucket =
  (typeof CHAT_ATTACHMENT_SIZE_BUCKETS)[number];

export type ChatContextKind = (typeof CHAT_CONTEXT_KINDS)[number];

export type ChatTransport = (typeof CHAT_TRANSPORTS)[number];

export type ChatGenerationBlockedCode =
  (typeof CHAT_GENERATION_BLOCKED_CODES)[number];

export type ChatDraftAction = (typeof CHAT_DRAFT_ACTIONS)[number];

export type ChatToolApprovalDecision =
  (typeof CHAT_TOOL_APPROVAL_DECISIONS)[number];

export type CommandPaletteOpenSource =
  (typeof COMMAND_PALETTE_OPEN_SOURCES)[number];

export type CommandPaletteResultKind =
  (typeof COMMAND_PALETTE_RESULT_KINDS)[number];

export interface ContentDataPointFlags {
  includePullRequests: boolean;
  includeCommits: boolean;
  includeReleases: boolean;
  includeLinearData: boolean;
}

export interface MessagePartLike {
  type: string;
}

export interface MessageLike {
  parts?: readonly MessagePartLike[];
}
