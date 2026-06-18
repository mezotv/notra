"use client";

import {
  ArrowRight02Icon,
  Cancel01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ANNOUNCEMENT_BANNER,
  ANNOUNCEMENT_BANNER_STORAGE_KEY,
} from "@/lib/announcement-banner/constants";

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(
      window.localStorage.getItem(ANNOUNCEMENT_BANNER_STORAGE_KEY) === "true"
    );
  }, []);

  if (dismissed) {
    return null;
  }

  function handleDismiss() {
    setDismissed(true);
    window.localStorage.setItem(ANNOUNCEMENT_BANNER_STORAGE_KEY, "true");
  }

  return (
    <div className="relative z-50 w-full border-primary/15 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-3 px-10 py-2 sm:px-12">
        <Link
          className="group flex flex-1 items-center justify-center gap-2 text-center font-medium font-sans text-foreground text-xs sm:gap-3 sm:text-sm"
          href={ANNOUNCEMENT_BANNER.href}
        >
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 font-semibold text-[0.625rem] text-primary-foreground uppercase tracking-wide sm:text-[0.6875rem]">
            <HugeiconsIcon className="size-3" icon={SparklesIcon} />
            {ANNOUNCEMENT_BANNER.badge}
          </span>
          <span className="text-pretty">{ANNOUNCEMENT_BANNER.message}</span>
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary transition-transform duration-150 ease-out group-hover:translate-x-0.5">
            <span className="hidden sm:inline">{ANNOUNCEMENT_BANNER.cta}</span>
            <span className="sm:hidden">{ANNOUNCEMENT_BANNER.ctaShort}</span>
            <HugeiconsIcon className="size-4" icon={ArrowRight02Icon} />
          </span>
        </Link>
        <button
          aria-label="Dismiss announcement"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          onClick={handleDismiss}
          type="button"
        >
          <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
        </button>
      </div>
    </div>
  );
}
