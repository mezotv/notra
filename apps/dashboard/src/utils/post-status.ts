import { POST_STATUS_PRESENTATION } from "@/constants/post-status";
import type { PostStatus } from "@/schemas/content";

export function getPostStatusLabel(status: PostStatus): string {
  return POST_STATUS_PRESENTATION[status].label;
}
