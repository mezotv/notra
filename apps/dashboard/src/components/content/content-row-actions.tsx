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
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { PostStatus } from "@/schemas/content";

interface ContentRowActionsProps {
  id: string;
  title: string;
  status: PostStatus;
  organizationId: string;
}

export function ContentRowActions({
  id,
  title,
  status,
  organizationId,
}: ContentRowActionsProps) {
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              className="size-8 p-0"
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
}
