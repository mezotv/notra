"use client";

import {
  CpuIcon,
  Delete02Icon,
  MoreHorizontalIcon,
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useState } from "react";
import { Button } from "@/components/button";
import { getMcpFaviconUrl, MCP_ACCENT_COLOR } from "@/lib/integrations/mcp";
import type { McpServerCardProps } from "@/types/integrations/mcp";

export function McpServerCard({
  server,
  onToggle,
  onDelete,
}: McpServerCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <TitleCard
        accentColor={MCP_ACCENT_COLOR}
        action={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Badge variant={server.enabled ? "default" : "secondary"}>
              {server.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button size="icon-sm" variant="ghost">
                    <HugeiconsIcon
                      className="size-4"
                      icon={MoreHorizontalIcon}
                    />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => onToggle?.(server.id, !server.enabled)}
                >
                  {server.enabled ? "Disable" : "Enable"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(event) => {
                    event.preventDefault();
                    setShowDeleteDialog(true);
                  }}
                  variant="destructive"
                >
                  <HugeiconsIcon className="size-4" icon={Delete02Icon} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        className="h-full"
        heading={server.name}
        icon={
          <Avatar className="size-7 rounded-md after:hidden">
            <AvatarImage
              className="rounded-md"
              src={getMcpFaviconUrl(server.url)}
            />
            <AvatarFallback className="rounded-md bg-transparent">
              <HugeiconsIcon icon={CpuIcon} />
            </AvatarFallback>
          </Avatar>
        }
      >
        <div className="space-y-1">
          <Badge className="font-normal text-xs" variant="secondary">
            Streamable HTTP
          </Badge>
          <p className="truncate font-mono text-muted-foreground text-xs">
            {server.url}
          </p>
        </div>
      </TitleCard>

      <ResponsiveAlertDialog
        onOpenChange={setShowDeleteDialog}
        open={showDeleteDialog}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Delete MCP server?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              This will permanently remove &quot;{server.name}&quot; from this
              organization.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete?.(server.id);
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </>
  );
}
