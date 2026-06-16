"use client";

import { ArrowRight01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LANDING_BANNER_BADGE,
  LANDING_BANNER_DETAIL,
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
    <Link
      className="group sticky top-0 z-[70] flex w-full items-center justify-center gap-x-2 gap-y-1 bg-primary px-4 py-2.5 text-center font-medium text-primary-foreground text-sm transition-colors duration-150 ease-out hover:bg-primary-hover"
      href={LANDING_BANNER_HREF}
    >
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold text-xs">
        <HugeiconsIcon
          aria-hidden={true}
          className="size-3.5"
          icon={SparklesIcon}
        />
        {LANDING_BANNER_BADGE}
      </span>
      <span>
        <span className="font-semibold">{LANDING_BANNER_TEXT}</span>
        <span className="hidden text-primary-foreground/85 sm:inline">
          {" "}
          {LANDING_BANNER_DETAIL}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 font-semibold underline decoration-primary-foreground/40 underline-offset-2">
        {LANDING_BANNER_LINK_LABEL}
        <HugeiconsIcon
          aria-hidden={true}
          className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
          icon={ArrowRight01Icon}
        />
      </span>
    </Link>
  );
}
