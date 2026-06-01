"use client";

import { Delete02Icon, LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { Button } from "@/components/button";
import {
  isImageMimeType,
  isPdfMimeType,
  isTextMimeType,
} from "@/lib/upload/mime";
import { formatFullDate } from "@/utils/format";

export interface AttachmentRow {
  id: string;
  key: string;
  filename: string;
  mediaType: string;
  size: number;
  createdAt: Date;
  url: string;
}

function FileThumbnail({ row }: { row: AttachmentRow }) {
  if (isImageMimeType(row.mediaType)) {
    return (
      <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted/40">
        <Image
          alt={row.filename}
          className="object-cover"
          fill
          sizes="40px"
          src={row.url}
          unoptimized
        />
      </div>
    );
  }

  let label = "?";
  if (isPdfMimeType(row.mediaType)) {
    label = "PDF";
  } else if (isTextMimeType(row.mediaType)) {
    label = "T";
  }

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 font-medium text-muted-foreground text-xs">
      {label}
    </div>
  );
}

export function buildAttachmentColumns(options: {
  onDelete: (key: string) => void;
  pendingKey: string | null;
}): ColumnDef<AttachmentRow>[] {
  const { onDelete, pendingKey } = options;

  return [
    {
      id: "select",
      header: ({ table }) => (
        <input
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          className="size-4 cursor-pointer rounded border-border"
          onChange={(event) =>
            table.toggleAllPageRowsSelected(event.target.checked)
          }
          ref={(node) => {
            if (node) {
              node.indeterminate =
                !table.getIsAllPageRowsSelected() &&
                table.getIsSomePageRowsSelected();
            }
          }}
          type="checkbox"
        />
      ),
      cell: ({ row }) => (
        <input
          aria-label={`Select ${row.original.filename}`}
          checked={row.getIsSelected()}
          className="size-4 cursor-pointer rounded border-border"
          onChange={(event) => row.toggleSelected(event.target.checked)}
          onClick={(event) => event.stopPropagation()}
          type="checkbox"
        />
      ),
      enableSorting: false,
      size: 32,
    },
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-3">
          <FileThumbnail row={row.original} />
          <div className="min-w-0">
            <a
              className="inline-flex items-center gap-1 truncate font-medium text-sm hover:underline"
              href={row.original.url}
              rel="noopener"
              target="_blank"
            >
              <span className="truncate">{row.original.filename}</span>
              <HugeiconsIcon
                className="shrink-0 text-muted-foreground"
                icon={LinkSquare02Icon}
                size={12}
              />
            </a>
            <p className="truncate text-muted-foreground text-xs">
              {row.original.mediaType}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatFullDate(row.original.createdAt.getTime())}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          aria-label={`Delete ${row.original.filename}`}
          disabled={pendingKey === row.original.key}
          onClick={() => onDelete(row.original.key)}
          size="icon"
          variant="destructive"
        >
          <HugeiconsIcon icon={Delete02Icon} size={16} />
        </Button>
      ),
      size: 48,
    },
  ];
}
