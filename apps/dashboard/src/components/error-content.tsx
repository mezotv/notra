"use client";

import { cn } from "@notra/ui/lib/utils";
import Link from "next/link";
import { useEffect } from "react";

import { buttonVariants } from "@/components/button";
import { trackClientException } from "@/lib/analytics/posthog-client";
import type { ErrorContentProps } from "@/types/components/error";

export function ErrorContent({ error, reset, className }: ErrorContentProps) {
  useEffect(() => {
    trackClientException(error, { digest: error.digest });
  }, [error]);

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center px-4",
        className
      )}
    >
      <div className="text-center">
        <p className="text-muted-foreground text-sm font-medium">Error</p>
        <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-base">
          We hit an unexpected problem loading this page. You can try again or
          head back home.
        </p>
        {error.digest ? (
          <p className="text-muted-foreground mt-2 font-mono text-xs">
            Reference {error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            className={cn(buttonVariants())}
            onClick={() => reset()}
            type="button"
          >
            Try again
          </button>
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
