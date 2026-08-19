"use client";

import {
  ArrowDown01Icon,
  Linkedin02Icon,
  NewTwitterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/button";
import { CONNECT_X_CLASS } from "@/constants/analytics";
import { useHandleConnectSocialAccount } from "@/lib/hooks/use-connected-accounts";
import type { ConnectAccountsButtonsProps } from "@/types/analytics";

export function ConnectAccountsButtons({
  organizationId,
}: ConnectAccountsButtonsProps) {
  const twitter = useHandleConnectSocialAccount(organizationId, "twitter");
  const linkedin = useHandleConnectSocialAccount(organizationId, "linkedin");

  return (
    <div className="inline-flex items-stretch">
      <Button
        className={`${CONNECT_X_CLASS} corner-squircle gap-2 rounded-r-none`}
        disabled={twitter.isPending}
        onClick={twitter.handleConnect}
      >
        {twitter.isPending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <HugeiconsIcon className="size-4" icon={NewTwitterIcon} />
        )}
        Connect X
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="Connect another platform"
              className={`${CONNECT_X_CLASS} corner-squircle rounded-l-none border-white/20 border-l px-2.5`}
            />
          }
        >
          <HugeiconsIcon className="size-4" icon={ArrowDown01Icon} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem
            disabled={linkedin.isPending}
            onClick={linkedin.handleConnect}
          >
            {linkedin.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <HugeiconsIcon className="size-4" icon={Linkedin02Icon} />
            )}
            <span className="whitespace-nowrap">Connect LinkedIn</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
