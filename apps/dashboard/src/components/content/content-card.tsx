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
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { memo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PostStatus } from "@/schemas/content";
import { formatSnakeCaseLabel } from "@/utils/format";
import { QUERY_KEYS } from "@/utils/query-keys";

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
      const res = await fetch(
        `/api/organizations/${organizationId}/content/${id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      toast.success("Post deleted");
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.POSTS.list(organizationId),
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
      const res = await fetch(
        `/api/organizations/${organizationId}/content/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(
        newStatus === "published" ? "Post published" : "Post moved to drafts"
      );
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.POSTS.list(organizationId),
      });
    } catch {
      toast.error("Failed to update post status");
    } finally {
      setIsTogglingStatus(false);
    }
  }

  const cardContent = (
    <div
      className={cn(
        "group relative flex flex-col rounded-[1.25rem] border border-border/80 bg-muted/80 p-2",
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
        <Badge className="capitalize" variant="secondary">
          {getContentTypeLabel(contentType)}
        </Badge>
      </div>
    </div>
  );

  return (
    <>
      {href ? (
        <Link
          className="block w-full rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
