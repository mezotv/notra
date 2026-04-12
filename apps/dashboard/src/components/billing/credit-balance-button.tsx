"use client";

import { Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useCustomer } from "autumn-js/react";
import { useState } from "react";
import { CreditTopupModal } from "@/components/billing/credit-topup-modal";
import { FEATURES } from "@/constants/features";

function formatDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function CreditBalanceButton() {
  const [open, setOpen] = useState(false);
  const { data: customer, isLoading } = useCustomer({
    expand: ["balances.feature", "subscriptions.plan"],
  });

  if (isLoading) {
    return <Skeleton className="h-8 w-20 rounded-md" />;
  }

  if (!customer) {
    return null;
  }

  const hasActiveSubscription = customer.subscriptions?.some(
    (sub) => !sub.addOn && sub.status === "active"
  );

  if (!hasActiveSubscription) {
    return null;
  }

  const aiCredits = customer.balances?.[FEATURES.AI_CREDITS];
  const balance =
    typeof aiCredits?.remaining === "number" ? aiCredits.remaining : null;

  return (
    <>
      <Button
        className="gap-1.5 tabular-nums"
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
      >
        <HugeiconsIcon icon={Wallet01Icon} size={16} />
        {balance !== null ? formatDollars(balance) : "-"}
      </Button>
      <CreditTopupModal onOpenChange={setOpen} open={open} />
    </>
  );
}
