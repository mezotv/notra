import type { ContentType } from "@notra/ai/schemas/content";

export interface AgentContentTaskType {
  contentType: ContentType;
  contentLabel: string;
  brandAgentType: string;
}

export const AGENT_CONTENT_TASK_TYPES: Record<
  string,
  AgentContentTaskType | undefined
> = {
  changelog: {
    contentType: "changelog",
    contentLabel: "changelog",
    brandAgentType: "changelog",
  },
  blog_post: {
    contentType: "blog_post",
    contentLabel: "blog post",
    brandAgentType: "blog",
  },
  twitter_post: {
    contentType: "twitter_post",
    contentLabel: "tweet",
    brandAgentType: "twitter",
  },
  linkedin_post: {
    contentType: "linkedin_post",
    contentLabel: "LinkedIn post",
    brandAgentType: "linkedin",
  },
};
