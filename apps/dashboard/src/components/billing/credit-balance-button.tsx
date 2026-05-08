"use client";

import { Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { DropdownMenuItem } from "@notra/ui/components/ui/dropdown-menu";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { cn } from "@notra/ui/lib/utils";
import { useState } from "react";
import { CreditTopupModal } from "@/components/billing/credit-topup-modal";
import { useCreditBalance } from "@/lib/hooks/use-credit-balance";
import { formatDollars } from "@/utils/format";

export function CreditBalanceButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { isLoading, hasActiveSubscription, balance } = useCreditBalance();

  if (isLoading) {
    return <Skeleton className={cn("h-8 w-20 rounded-md", className)} />;
  }

  if (!hasActiveSubscription) {
    return null;
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-label={
                balance !== null
                  ? `Available credits: ${formatDollars(balance)}`
                  : "Available credits"
              }
              className={cn("gap-1.5 tabular-nums", className)}
              onClick={() => setOpen(true)}
              size="sm"
              variant="outline"
            >
              <HugeiconsIcon icon={Wallet01Icon} size={16} />
              {balance !== null ? formatDollars(balance) : "-"}
            </Button>
          }
        />
        <TooltipContent>Available credits</TooltipContent>
      </Tooltip>
      <CreditTopupModal onOpenChange={setOpen} open={open} />
    </>
  );
}

export function CreditBalanceMenuItem({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { isLoading, hasActiveSubscription, balance } = useCreditBalance();

  if (isLoading || !hasActiveSubscription) {
    return null;
  }

  return (
    <>
      <DropdownMenuItem
        className={cn("cursor-pointer", className)}
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={Wallet01Icon} />
        Credits
        {balance !== null ? (
          <span className="ml-auto text-muted-foreground tabular-nums">
            {formatDollars(balance)}
          </span>
        ) : null}
      </DropdownMenuItem>
      <CreditTopupModal onOpenChange={setOpen} open={open} />
    </>
  );
}
