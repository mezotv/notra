"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { XVerificationBadge } from "@/components/icons/x-verification-badge";
import {
  useTrackAccount,
  useTrackAccountPreview,
} from "@/lib/hooks/use-social-analytics";
import { cn } from "@/lib/utils";
import type { ResolvedTwitterAccount } from "@/types/analytics";
import { formatMetric } from "@/utils/analytics-charts";
import { isSquareTwitterAvatar } from "@/utils/twitter";

interface TrackAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

const LEADING_AT = /^@/;

export function TrackAccountDialog({
  open,
  onOpenChange,
  organizationId,
}: TrackAccountDialogProps) {
  const id = useId();
  const [handle, setHandle] = useState("");
  const [account, setAccount] = useState<ResolvedTwitterAccount | null>(null);
  const [notFound, setNotFound] = useState(false);
  const preview = useTrackAccountPreview(organizationId);
  const track = useTrackAccount(organizationId);

  const reset = () => {
    setHandle("");
    setAccount(null);
    setNotFound(false);
  };

  const handleLookup = () => {
    const username = handle.trim().replace(LEADING_AT, "");
    if (username.length === 0) {
      return;
    }
    setAccount(null);
    setNotFound(false);
    preview.mutate(username, {
      onSuccess: (result) => {
        setAccount(result.account);
        setNotFound(result.account === null);
      },
    });
  };

  const handleConfirm = () => {
    if (!account) {
      return;
    }
    track.mutate(account.username, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <ResponsiveDialog
      onOpenChange={(next) => {
        if (!next) {
          reset();
        }
        onOpenChange(next);
      }}
      open={open}
    >
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Track an account</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Follow a public X account on your leaderboard — teammates,
            affiliates, or competitors. Their public posts sync hourly and are
            visible to everyone in this workspace.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-4 px-4 md:px-0">
          <div className="space-y-2">
            <Label htmlFor={`${id}-handle`}>X handle</Label>
            <div className="flex gap-2">
              <Input
                id={`${id}-handle`}
                onChange={(event) => setHandle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleLookup();
                  }
                }}
                placeholder="@handle"
                value={handle}
              />
              <Button
                disabled={handle.trim().length === 0 || preview.isPending}
                onClick={handleLookup}
                variant="outline"
              >
                {preview.isPending && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                Look up
              </Button>
            </div>
          </div>
          {notFound && (
            <p className="text-muted-foreground text-sm">
              No account found with that handle. Check the spelling and try
              again.
            </p>
          )}
          {account && (
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Avatar
                className={cn(
                  "size-10",
                  isSquareTwitterAvatar(account.verifiedType) && "rounded-md"
                )}
              >
                {account.profileImageUrl && (
                  <AvatarImage
                    alt={account.displayName ?? account.username}
                    className={cn(
                      isSquareTwitterAvatar(account.verifiedType) &&
                        "rounded-md"
                    )}
                    src={account.profileImageUrl}
                  />
                )}
                <AvatarFallback>
                  {account.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 font-medium text-sm">
                  <span className="truncate">
                    {account.displayName ?? account.username}
                  </span>
                  <XVerificationBadge
                    className="size-3.5 shrink-0"
                    verified={account.verified}
                    verifiedType={account.verifiedType}
                  />
                </p>
                <p className="text-muted-foreground text-xs">
                  @{account.username}
                  {account.followersCount !== null &&
                    ` · ${formatMetric(account.followersCount)} followers`}
                </p>
              </div>
            </div>
          )}
        </div>
        <ResponsiveDialogFooter>
          <Button
            disabled={!account || track.isPending}
            onClick={handleConfirm}
          >
            {track.isPending && <Loader2Icon className="size-4 animate-spin" />}
            {account ? `Track @${account.username}` : "Track account"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
