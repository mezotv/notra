"use client";

import { cn } from "@notra/ui/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/button";
import type { NotFoundContentProps } from "@/types/components/not-found";

export function NotFoundContent({ className }: NotFoundContentProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center px-4",
        className
      )}
    >
      <div className="text-center">
        <p className="text-muted-foreground text-sm font-medium">404</p>
        <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Page not found
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-base">
          Sorry, we couldn't find the page you're looking for. It might have
          been moved or deleted.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link className={cn(buttonVariants())} href="/">
            Go home
          </Link>
          <button
            className={cn(buttonVariants({ variant: "outline" }))}
            onClick={() => router.back()}
            type="button"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
