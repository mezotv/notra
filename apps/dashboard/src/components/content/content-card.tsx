"use client";

import {
  Delete02Icon,
  MoreVerticalIcon,
  SentIcon,
  TextIcon,
} from "@hugeicons/core-free-icons";
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
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { memo, useState } from "react";
import { toast } from "sonner";
import { dashboardOrpc } from "@/lib/orpc/query";
import { cn } from "@/lib/utils";
import type { PostStatus } from "@/schemas/content";
import { formatSnakeCaseLabel } from "@/utils/format";
import { OutputTypeIcon } from "@/utils/output-types";

const CONTENT_TYPES = [
  "changelog",
  "blog_post",
  "twitter_post",
  "linkedin_post",
  "investor_update",
] as const;

type ContentType = (typeof CONTENT_TYPES)[number];

function getContentTypeLabel(contentType: ContentType): string {
  if (contentType === "twitter_post") {
    return "tweet";
  }

  return formatSnakeCaseLabel(contentType);
}

interface ContentCardProps {
  id: string;
  title: string;
  preview: string;
  contentType: ContentType;
  status: PostStatus;
  organizationId: string;
  className?: string;
  href?: string;
}

const ContentCard = memo(function ContentCard({
  id,
  title,
  preview,
  contentType,
  status,
  organizationId,
  className,
  href,
}: ContentCardProps) {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await dashboardOrpc.content.delete.call({
        organizationId,
        contentId: id,
      });

      toast.success("Post deleted");
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.content.list.key(),
      });
      setShowDeleteDialog(false);
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleStatus() {
    setIsTogglingStatus(true);
    const newStatus = status === "published" ? "draft" : "published";
    try {
      await dashboardOrpc.content.update.call({
        organizationId,
        contentId: id,
        status: newStatus,
      });

      toast.success(
        newStatus === "published" ? "Post published" : "Post moved to drafts"
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.content.list.key(),
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.content.metrics.get.queryKey({
            input: { organizationId },
          }),
        }),
      ]);
    } catch {
      toast.error("Failed to update post status");
    } finally {
      setIsTogglingStatus(false);
    }
  }

  const cardContent = (
    <div
      className={cn(
        "group relative flex flex-col rounded-lg border border-border/80 bg-muted/80 p-2",
        "h-full transition-colors",
        href && "cursor-pointer hover:bg-muted/80",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 py-1.5 pr-2 pl-2">
        <p className="min-w-0 truncate font-medium text-lg">{title}</p>
        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  className="size-7 p-0"
                  onClick={(e) => e.preventDefault()}
                  variant="ghost"
                >
                  <span className="sr-only">Open menu</span>
                  <HugeiconsIcon className="size-4" icon={MoreVerticalIcon} />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                disabled={isTogglingStatus}
                onClick={(e) => {
                  e.preventDefault();
                  handleToggleStatus();
                }}
              >
                <HugeiconsIcon
                  className="mr-2 size-4"
                  icon={status === "published" ? TextIcon : SentIcon}
                />
                {status === "published" ? "Move to draft" : "Publish"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  setShowDeleteDialog(true);
                }}
                variant="destructive"
              >
                <HugeiconsIcon className="mr-2 size-4" icon={Delete02Icon} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 rounded-[0.75rem] border border-border/80 bg-background px-4 py-3">
        <p className="line-clamp-3 text-muted-foreground text-sm">{preview}</p>
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Badge
          className="capitalize"
          variant={status === "published" ? "default" : "outline"}
        >
          {status}
        </Badge>
        <Badge
          className="flex items-center gap-1 capitalize"
          variant="secondary"
        >
          <OutputTypeIcon className="size-3" outputType={contentType} />
          {getContentTypeLabel(contentType)}
        </Badge>
      </div>
    </div>
  );

  return (
    <>
      {href ? (
        <Link
          className="block h-full w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={href}
        >
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}

      <ResponsiveAlertDialog
        onOpenChange={(open) => {
          if (!isDeleting) {
            setShowDeleteDialog(open);
          }
        }}
        open={showDeleteDialog}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Delete post?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              This will permanently delete &quot;{title}&quot;. This action
              cannot be undone.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel disabled={isDeleting}>
              Cancel
            </ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </>
  );
});

export { ContentCard, CONTENT_TYPES, getContentTypeLabel };
export type { ContentCardProps, ContentType };
