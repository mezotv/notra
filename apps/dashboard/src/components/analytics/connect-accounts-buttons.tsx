"use client";

import { Linkedin02Icon, NewTwitterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loader2Icon } from "lucide-react";
import { useHandleConnectSocialAccount } from "@/lib/hooks/use-connected-accounts";

interface ConnectAccountsButtonsProps {
  organizationId: string;
}

export function ConnectAccountsButtons({
  organizationId,
}: ConnectAccountsButtonsProps) {
  const twitter = useHandleConnectSocialAccount(organizationId, "twitter");
  const linkedin = useHandleConnectSocialAccount(organizationId, "linkedin");

  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border">
      <span className="border-r px-2.5 py-1.5 text-muted-foreground text-xs">
        Connect
      </span>
      <button
        aria-label="Connect X account"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
        disabled={twitter.isPending}
        onClick={twitter.handleConnect}
        type="button"
      >
        {twitter.isPending ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <HugeiconsIcon icon={NewTwitterIcon} size={14} />
        )}
        X
      </button>
      <button
        aria-label="Connect LinkedIn account"
        className="flex items-center gap-1.5 border-l px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
        disabled={linkedin.isPending}
        onClick={linkedin.handleConnect}
        type="button"
      >
        {linkedin.isPending ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <HugeiconsIcon icon={Linkedin02Icon} size={14} />
        )}
        LinkedIn
      </button>
    </div>
  );
}
