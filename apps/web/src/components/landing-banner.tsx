"use client";

import { ArrowRight01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LANDING_BANNER_HREF,
  LANDING_BANNER_LINK_LABEL,
  LANDING_BANNER_TEXT,
} from "@/lib/landing-banner/constants";

export function LandingBanner() {
  const pathname = usePathname();

  if (pathname !== "/") {
    return null;
  }

  return (
    <div className="sticky top-0 z-[60] mb-2 flex w-full justify-center">
      <Link
        className="group inset-shadow-sm inset-shadow-white flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-center font-medium text-neutral-700 text-sm shadow-black/5 shadow-sm ring-1 ring-black/5 transition-colors duration-150 ease-out hover:bg-neutral-50 dark:inset-shadow-white/5 dark:bg-neutral-950 dark:text-neutral-200 dark:ring-white/10 dark:hover:bg-neutral-900"
        href={LANDING_BANNER_HREF}
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <HugeiconsIcon
            aria-hidden={true}
            className="size-3.5"
            icon={SparklesIcon}
          />
        </span>
        <span>{LANDING_BANNER_TEXT}</span>
        <span className="inline-flex items-center gap-1 text-primary">
          {LANDING_BANNER_LINK_LABEL}
          <HugeiconsIcon
            aria-hidden={true}
            className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
            icon={ArrowRight01Icon}
          />
        </span>
      </Link>
    </div>
  );
}
