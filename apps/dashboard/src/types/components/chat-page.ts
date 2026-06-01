export interface StandaloneChatPageClientProps {
  organizationSlug: string;
  chatId?: string;
}

export type CreateToolContentType =
  | "blog_post"
  | "changelog"
  | "investor_update"
  | "linkedin_post"
  | "twitter_post";
