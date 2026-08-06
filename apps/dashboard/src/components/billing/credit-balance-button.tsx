"use client";

import { Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DropdownMenuItem } from "@notra/ui/components/ui/dropdown-menu";
import { cn } from "@notra/ui/lib/utils";
import { useState } from "react";
import { CreditTopupModal } from "@/components/billing/credit-topup-modal";
import { useCreditBalance } from "@/lib/hooks/use-credit-balance";
import { formatDollars } from "@/utils/format";

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
