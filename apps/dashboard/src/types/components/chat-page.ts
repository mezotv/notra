import type { ReactNode } from "react";

export interface StandaloneChatPageClientProps {
  organizationSlug: string;
  chatId?: string;
}

export interface UserImageGridProps {
  children: ReactNode;
}

export interface UserMessageEditorProps {
  initialText: string;
  onCancel: () => void;
  onSubmit: (text: string) => void;
}

export interface UserMessageTextBubbleProps {
  children: ReactNode;
  isEditing: boolean;
  initialText: string;
  onCancel: () => void;
  onSubmit: (text: string) => void;
}

export type CreateToolContentType =
  | "blog_post"
  | "changelog"
  | "investor_update"
  | "linkedin_post"
  | "twitter_post";
