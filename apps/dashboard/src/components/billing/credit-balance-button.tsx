"use client";

import { Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DropdownMenuItem } from "@notra/ui/components/ui/dropdown-menu";
import { cn } from "@notra/ui/lib/utils";
import { useCreditBalance } from "@/lib/hooks/use-credit-balance";
import type { CreditBalanceMenuItemProps } from "@/types/billing/credits";
import { formatDollars } from "@/utils/format";

export function CreditBalanceMenuItem({
  className,
  onOpenTopup,
}: CreditBalanceMenuItemProps) {
  const { isLoading, hasActiveSubscription, balance } = useCreditBalance();

  if (isLoading || !hasActiveSubscription) {
    return null;
  }

  return (
    <DropdownMenuItem
      className={cn("cursor-pointer", className)}
      onClick={onOpenTopup}
    >
      <HugeiconsIcon icon={Wallet01Icon} />
      Credits
      {balance !== null ? (
        <span className="ml-auto text-muted-foreground tabular-nums">
          {formatDollars(balance)}
        </span>
      ) : null}
    </DropdownMenuItem>
  );
}
