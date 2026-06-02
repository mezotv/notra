import type { PostStatus } from "@/schemas/content";

export type ContentCardType =
  | "changelog"
  | "blog_post"
  | "twitter_post"
  | "linkedin_post"
  | "investor_update"
  | "image";

export interface ContentCardProps {
  id: string;
  title: string;
  preview: string;
  contentType: string;
  status: PostStatus;
  organizationId: string;
  className?: string;
  href?: string;
  imagePreviewSrc?: string | null;
}
