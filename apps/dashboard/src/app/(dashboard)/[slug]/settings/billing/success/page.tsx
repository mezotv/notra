"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Confetti } from "@neoconfetti/react";
import { cn } from "@notra/ui/lib/utils";
import { useCustomer } from "autumn-js/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/button";
import { planDisplayName } from "@/utils/billing-plans";

function BillingSuccessPageContent() {
  const { slug } = useParams<{ slug: string }>();
  const { openCustomerPortal, data: customer } = useCustomer({
    expand: ["subscriptions.plan"],
  });

  const activeSubscription = customer?.subscriptions?.find(
    (sub) => !sub.addOn && sub.status === "active"
  );
  const planName =
    planDisplayName(activeSubscription?.plan?.name) ?? "your new plan";

  async function handleManageBilling() {
    try {
      await openCustomerPortal({
        returnUrl: `${window.location.origin}/${slug}/settings/billing`,
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not open billing portal. Please try again."
      );
    }
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2">
        <Confetti
          colors={[
            "var(--primary)",
            "#FFC700",
            "#FF6B6B",
            "#41BBC7",
            "#A78BFA",
            "#34D399",
          ]}
          duration={4000}
          force={0.6}
          particleCount={200}
          particleShape="mix"
          particleSize={10}
          stageHeight={1000}
          stageWidth={1600}
        />
      </div>

      <div className="flex max-w-md flex-col items-center text-center">
        <HugeiconsIcon className="size-12 text-emerald-500" icon={Tick02Icon} />

        <h1 className="text-foreground mt-6 text-4xl font-bold tracking-tight">
          Payment Successful!
        </h1>
        <p className="text-muted-foreground mt-3 text-base leading-relaxed">
          Thanks for subscribing to {planName}. Your plan is active and all
          features are ready to use.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            className={cn(buttonVariants({ variant: "default", size: "lg" }))}
            href={`/${slug}`}
          >
            Go to dashboard
          </Link>
          <button
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            onClick={handleManageBilling}
            type="button"
          >
            Manage billing
          </button>
        </div>

        <Link
          className="text-muted-foreground hover:text-foreground mt-6 text-sm underline underline-offset-4 transition-colors"
          href={`/${slug}/settings/billing`}
        >
          View invoices & usage
        </Link>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <BillingSuccessPageContent />
    </Suspense>
  );
}
