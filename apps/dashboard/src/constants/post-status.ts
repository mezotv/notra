import type { PostStatus } from "@/schemas/content";
import type { PostStatusPresentation } from "@/types/content/status-badge";

export const POST_STATUS_PRESENTATION: Record<
  PostStatus,
  PostStatusPresentation
> = {
  draft: {
    label: "Draft",
    variant: "outline",
    className: "",
  },
  in_review: {
    label: "In review",
    variant: "outline",
    className:
      "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  approved: {
    label: "Approved",
    variant: "outline",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  published: {
    label: "Published",
    variant: "default",
    className: "",
  },
};
