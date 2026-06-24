"use client";

import {
  Copy01Icon,
  Edit02Icon,
  LinkSquare02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, buttonVariants } from "@/components/button";
import { cn } from "@/lib/utils";
import type { GuidelinesResourceActionsProps } from "@/types/brand-identity";
import { copyToClipboard } from "@/utils/copy-to-clipboard";

export function GuidelinesResourceActions({
  url,
  label,
  onEdit,
}: GuidelinesResourceActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {onEdit ? (
        <Button
          aria-label={`Edit ${label}`}
          onClick={onEdit}
          size="icon-sm"
          variant="ghost"
        >
          <HugeiconsIcon className="size-3.5" icon={Edit02Icon} />
        </Button>
      ) : null}
      <a
        aria-label={`Open ${label}`}
        className={cn(buttonVariants({ size: "icon-sm", variant: "ghost" }))}
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <HugeiconsIcon className="size-3.5" icon={LinkSquare02Icon} />
      </a>
      <Button
        aria-label={`Copy ${label} URL`}
        onClick={() => copyToClipboard(url)}
        size="icon-sm"
        variant="ghost"
      >
        <HugeiconsIcon className="size-3.5" icon={Copy01Icon} />
      </Button>
    </div>
  );
}
