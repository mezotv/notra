import type { ReactNode } from "react";

import type { ChatMessageAuthor } from "@/types/chat";

export interface MessageAuthorAvatarProps {
  author: ChatMessageAuthor;
  size?: "default" | "sm";
}

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
