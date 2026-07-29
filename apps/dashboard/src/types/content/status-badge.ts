import type { Badge } from "@notra/ui/components/ui/badge";
import type { ComponentProps } from "react";
import type { PostStatus } from "@/schemas/content";

export type PostStatusBadgeVariant = ComponentProps<typeof Badge>["variant"];

export interface PostStatusPresentation {
  label: string;
  variant: PostStatusBadgeVariant;
  className: string;
}

export interface PostStatusBadgeProps {
  status: PostStatus;
  className?: string;
}
