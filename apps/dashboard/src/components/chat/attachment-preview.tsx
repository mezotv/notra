"use client";

import type { ChatAttachment } from "@notra/ai/types/chat";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@notra/ui/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { MIME_DISPLAY_LABELS } from "@/constants/upload";
import {
  isImageMimeType,
  isPdfMimeType,
  isTextMimeType,
} from "@/lib/upload/mime";
import { formatBytes } from "@/utils/format";

function TextPreview({ url }: { url: string }) {
  const { data: content, error } = useQuery({
    queryKey: ["attachment-text-preview", url],
    queryFn: async ({ signal }) => {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`Failed to load (${response.status})`);
      }
      return await response.text();
    },
    retry: false,
  });

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive text-sm">
        {error.message}
      </div>
    );
  }

  if (content === undefined) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
      </div>
    );
  }

  return (
    <pre className="h-full overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 font-mono text-xs leading-relaxed">
      {content}
    </pre>
  );
}

type PreviewAttachment =
  | ChatAttachment
  | (Omit<ChatAttachment, "size" | "key"> & { size?: number; key?: string });

interface AttachmentPreviewDialogProps {
  attachment: PreviewAttachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttachmentPreviewDialog({
  attachment,
  open,
  onOpenChange,
}: AttachmentPreviewDialogProps) {
  if (!attachment) {
    return null;
  }

  const typeLabel =
    MIME_DISPLAY_LABELS[attachment.mediaType] ?? attachment.mediaType;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex h-[80vh] max-w-3xl flex-col gap-3 p-4 sm:max-w-3xl">
        <div className="min-w-0 pr-8">
          <DialogTitle className="truncate text-sm">
            {attachment.filename}
          </DialogTitle>
          <p className="mt-1 text-muted-foreground text-xs">
            {typeof attachment.size === "number"
              ? `${typeLabel} · ${formatBytes(attachment.size)}`
              : typeLabel}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
          {isImageMimeType(attachment.mediaType) && (
            <div className="relative flex h-full w-full items-center justify-center bg-muted/20">
              <Image
                alt={attachment.filename}
                className="h-full w-full object-contain"
                height={1200}
                src={attachment.url}
                unoptimized
                width={1200}
              />
            </div>
          )}
          {isPdfMimeType(attachment.mediaType) && (
            <iframe
              className="h-full w-full"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts"
              src={attachment.url}
              title={attachment.filename}
            />
          )}
          {isTextMimeType(attachment.mediaType) && (
            <TextPreview url={attachment.url} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
