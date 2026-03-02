"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Confetti } from "@neoconfetti/react";
import { buttonVariants } from "@notra/ui/components/ui/button";
import { cn } from "@notra/ui/lib/utils";
import { useCustomer } from "autumn-js/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function BillingSuccessPage() {
  const { slug } = useParams<{ slug: string }>();
  const { openBillingPortal } = useCustomer();

  async function handleManageBilling() {
    try {
      await openBillingPortal({
        returnUrl: `${window.location.origin}/${slug}/billing`,
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
      <div className="-translate-x-1/2 pointer-events-none absolute top-0 left-1/2">
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

        <h1 className="mt-6 font-bold text-4xl text-foreground tracking-tight">
          Payment Successful!
        </h1>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          Thanks for upgrading to Pro. Your new plan is active and all features
          are ready to use.
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
          className="mt-6 text-muted-foreground text-sm underline underline-offset-4 transition-colors hover:text-foreground"
          href={`/${slug}/billing`}
        >
          View invoices & usage
        </Link>
      </div>
    </div>
  );
}
