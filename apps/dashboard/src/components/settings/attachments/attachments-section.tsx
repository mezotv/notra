"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@notra/ui/components/shared/responsive-alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { AttachmentPreviewDialog } from "@/components/chat/attachment-preview";
import { EmptyState } from "@/components/empty-state";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { AttachmentRow } from "@/types/settings/attachments";
import { AttachmentCard } from "./attachment-card";

type Filter = "all" | "image" | "pdf" | "text" | "other";

const FILTER_LABELS: Record<Filter, string> = {
  all: "All files",
  image: "Images",
  pdf: "PDFs",
  text: "Text",
  other: "Other",
};

const LOADING_SKELETON_KEYS = [
  "sk-1",
  "sk-2",
  "sk-3",
  "sk-4",
  "sk-5",
  "sk-6",
  "sk-7",
  "sk-8",
] as const;

export function AttachmentsSection() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useOrganizationsContext();
  const [filter, setFilter] = useState<Filter>("all");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [confirmKeys, setConfirmKeys] = useState<string[] | null>(null);
  const [previewAttachment, setPreviewAttachment] =
    useState<AttachmentRow | null>(null);

  const organizationId = activeOrganization?.id ?? "";

  const { data, isLoading } = useQuery(
    dashboardOrpc.attachments.list.queryOptions({
      input: { filter, organizationId },
      enabled: Boolean(organizationId),
    })
  );

  const attachments: AttachmentRow[] = useMemo(() => {
    return (
      data?.attachments?.map((row) => ({
        id: row.id,
        key: row.key,
        filename: row.filename,
        mediaType: row.mediaType,
        size: row.size,
        createdAt: new Date(row.createdAt),
        url: row.url,
      })) ?? []
    );
  }, [data?.attachments]);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.attachments.list.key(),
    });

  const deleteManyMutation = useMutation({
    mutationFn: async (keys: string[]) => {
      await dashboardOrpc.attachments.deleteMany.call({ keys, organizationId });
    },
    onSuccess: async (_data, keys) => {
      toast.success(
        keys.length === 1
          ? "Attachment deleted"
          : `${keys.length} attachments deleted`
      );
      setRowSelection((prev) => {
        const next = { ...prev };
        for (const key of keys) {
          delete next[key];
        }
        return next;
      });
      await invalidate();
    },
    onError: () => {
      toast.error("Failed to delete attachments");
    },
    onSettled: () => {
      setPendingKey(null);
      setConfirmKeys(null);
    },
  });

  const selectedKeys = Object.keys(rowSelection).filter((k) => rowSelection[k]);
  const hasSelection = selectedKeys.length > 0;
  const confirmOpen = confirmKeys !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Filter</span>
          <Select
            onValueChange={(value) => {
              setFilter(value as Filter);
              setRowSelection({});
            }}
            value={filter}
          >
            <SelectTrigger className="w-36" size="sm">
              <SelectValue>
                {(value) => FILTER_LABELS[value as Filter] ?? FILTER_LABELS.all}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {FILTER_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasSelection && (
          <Button
            disabled={deleteManyMutation.isPending}
            onClick={() => setConfirmKeys(selectedKeys)}
            size="sm"
            variant="destructive"
          >
            {deleteManyMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <HugeiconsIcon icon={Delete02Icon} size={16} />
            )}
            Delete {selectedKeys.length} selected
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {LOADING_SKELETON_KEYS.map((skeletonKey) => (
            <div
              className="overflow-hidden rounded-lg border border-border/80"
              key={skeletonKey}
            >
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="space-y-2 px-3 py-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isLoading || attachments.length > 0 ? null : (
        <EmptyState
          className="min-h-56"
          description="Files you upload in chat will show up here."
          title="No attachments yet"
        />
      )}

      {!isLoading && attachments.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {attachments.map((attachment) => (
            <AttachmentCard
              attachment={attachment}
              key={attachment.key}
              onDelete={() => setConfirmKeys([attachment.key])}
              onOpen={() => setPreviewAttachment(attachment)}
              onSelectedChange={(selected) => {
                setRowSelection((prev) => {
                  if (selected) {
                    return { ...prev, [attachment.key]: true };
                  }
                  const next = { ...prev };
                  delete next[attachment.key];
                  return next;
                });
              }}
              pending={pendingKey === attachment.key}
              selected={Boolean(rowSelection[attachment.key])}
            />
          ))}
        </div>
      ) : null}

      <AttachmentPreviewDialog
        attachment={previewAttachment}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAttachment(null);
          }
        }}
        open={previewAttachment !== null}
      />

      <ResponsiveAlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setConfirmKeys(null);
          }
        }}
        open={confirmOpen}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              {confirmKeys && confirmKeys.length > 1
                ? `Delete ${confirmKeys.length} attachments?`
                : "Delete this attachment?"}
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              The file will be removed from storage and from any threads that
              reference it. This cannot be undone.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!confirmKeys) {
                  return;
                }
                if (confirmKeys.length === 1) {
                  setPendingKey(confirmKeys[0] ?? null);
                }
                deleteManyMutation.mutate(confirmKeys);
              }}
            >
              Delete
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </div>
  );
}
