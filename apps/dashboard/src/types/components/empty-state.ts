import type { Button as UiButton } from "@notra/ui/components/ui/button";
import type { ComponentProps, ReactNode } from "react";

export interface EmptyStateProps extends ComponentProps<"div"> {
  title: string;
  titleIcon?: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  actionLabel?: string;
  actionVariant?: ComponentProps<typeof UiButton>["variant"];
  onActionClick?: ComponentProps<"button">["onClick"];
  actionIcon?: ReactNode;
  preview?: ReactNode;
}

export interface EmptyStateTablePreviewProps {
  columns: readonly number[];
  rows?: number;
}

export type EmptyStateCardsPreviewVariant =
  | "content"
  | "skill"
  | "reference"
  | "run"
  | "integration";

export interface EmptyStateCardsPreviewProps {
  variant?: EmptyStateCardsPreviewVariant;
  count?: number;
  columns?: 2 | 3;
}

export interface EmptyStateSkillCardLayout {
  title: number;
  date: number;
  lines: readonly { key: string; width: string }[];
}
