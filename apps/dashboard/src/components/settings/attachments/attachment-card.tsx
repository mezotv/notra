"use client";

import { Delete02Icon, File02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { Button } from "@/components/button";
import { MIME_DISPLAY_LABELS } from "@/constants/upload";
import {
  isImageMimeType,
  isPdfMimeType,
  isTextMimeType,
} from "@/lib/upload/mime";
import { cn } from "@/lib/utils";
import type { AttachmentCardProps } from "@/types/settings/attachments";
import { formatRelativeDate } from "@/utils/content-preview";

function FilePlaceholder({ mediaType }: { mediaType: string }) {
  let label = "File";
  if (isPdfMimeType(mediaType)) {
    label = "PDF";
  } else if (isTextMimeType(mediaType)) {
    label = "Text";
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/40 text-muted-foreground">
      <HugeiconsIcon className="size-8" icon={File02Icon} />
      <span className="font-medium text-xs">{label}</span>
    </div>
  );
}

export function AttachmentCard({
  attachment,
  selected,
  pending,
  onOpen,
  onDelete,
  onSelectedChange,
}: AttachmentCardProps) {
  const isImage = isImageMimeType(attachment.mediaType);
  const typeLabel =
    MIME_DISPLAY_LABELS[attachment.mediaType] ?? attachment.mediaType;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border/80 bg-background shadow-2xs",
        selected && "ring-2 ring-ring"
      )}
    >
      <div className="relative aspect-square bg-muted/20">
        <button
          aria-label={`Preview ${attachment.filename}`}
          className="absolute inset-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          onClick={onOpen}
          type="button"
        >
          {isImage ? (
            <Image
              alt={attachment.filename}
              className="object-cover"
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
              src={attachment.url}
              unoptimized
            />
          ) : (
            <FilePlaceholder mediaType={attachment.mediaType} />
          )}
        </button>

        <label className="absolute top-2 left-2 z-10 flex size-7 cursor-pointer items-center justify-center rounded-md border border-border bg-background/90 shadow-sm backdrop-blur-sm">
          <input
            aria-label={`Select ${attachment.filename}`}
            checked={selected}
            className="size-3.5 cursor-pointer rounded border-border"
            onChange={(event) => onSelectedChange(event.target.checked)}
            onClick={(event) => event.stopPropagation()}
            type="checkbox"
          />
        </label>

        <Button
          aria-label={`Delete ${attachment.filename}`}
          className="absolute top-2 right-2 z-10"
          disabled={pending}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          size="icon-sm"
          variant="destructive"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
        </Button>
      </div>

      <div className="space-y-0.5 px-3 py-2">
        <button
          className="block w-full truncate text-left font-medium text-sm hover:underline"
          onClick={onOpen}
          type="button"
        >
          {attachment.filename}
        </button>
        <p className="truncate text-muted-foreground text-xs">
          {typeLabel} · {formatRelativeDate(attachment.createdAt.toISOString())}
        </p>
      </div>
    </div>
  );
}
