import type { PublishedSocialPost } from "@/types/content/post-social";

export type PreviewIncomingState = "draft" | "finished";
export type PreviewEffectiveState = "draft" | "loading" | "finished";

export type SocialPreviewUserAction =
  | "none"
  | "saving"
  | "generating"
  | "save-failed";

export interface SocialPreviewState {
  userAction: SocialPreviewUserAction;
  draftMarkdown: string;
  regenerateOpen: boolean;
  regenerateInstructions: string;
  isOpen: boolean;
}

export type SocialPreviewAction =
  | { type: "userActionChanged"; userAction: SocialPreviewUserAction }
  | { type: "draftMarkdownChanged"; draftMarkdown: string }
  | { type: "regenerateOpenChanged"; open: boolean }
  | { type: "regenerateOpenToggled" }
  | { type: "regenerateInstructionsChanged"; instructions: string }
  | { type: "openChanged"; open: boolean };

export type BlogChangelogPreviewUserAction =
  | "none"
  | "saving"
  | "publishing"
  | "generating"
  | "save-failed";

export interface BlogChangelogPreviewState {
  userAction: BlogChangelogPreviewUserAction;
  draftTitle: string;
  draftMarkdown: string;
  regenerateOpen: boolean;
  regenerateInstructions: string;
  isOpen: boolean;
}

export type BlogChangelogPreviewAction =
  | {
      type: "userActionChanged";
      userAction: BlogChangelogPreviewUserAction;
    }
  | { type: "draftTitleChanged"; draftTitle: string }
  | { type: "draftMarkdownChanged"; draftMarkdown: string }
  | { type: "regenerateOpenChanged"; open: boolean }
  | { type: "regenerateOpenToggled" }
  | { type: "regenerateInstructionsChanged"; instructions: string }
  | { type: "openChanged"; open: boolean };

export interface SocialPreviewCallbacks {
  onApprove?: () => void;
  onPublished?: (published: PublishedSocialPost) => void;
  onDeny?: () => void;
  onPersist?: (
    status: "draft" | "published",
    payload: { title: string; markdown: string }
  ) => Promise<void>;
  onRegenerate?: (
    instructions: string,
    payload: { title: string; markdown: string }
  ) => void;
}

export interface SocialPreviewProps extends SocialPreviewCallbacks {
  state: PreviewIncomingState;
  title: string;
  markdown: string;
  organizationId?: string;
  organization?: {
    name: string;
    logo?: string | null;
  };
  persistedStatus?: "draft" | "published";
}
