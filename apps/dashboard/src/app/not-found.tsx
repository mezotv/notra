"use client";

import { buttonVariants } from "@notra/ui/components/ui/button";
import { cn } from "@notra/ui/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="font-medium text-muted-foreground text-sm">404</p>
        <h1 className="mt-2 font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
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
