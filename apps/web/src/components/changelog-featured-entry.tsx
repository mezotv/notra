import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { NotraMark } from "@/components/notra-mark";
import {
  CHANGELOG_ACCENT_GRADIENT,
  CHANGELOG_FEATURED_GRADIENT,
} from "@/constants/changelog";
import { formatChangelogDate } from "@/utils/changelog";
import type { ChangelogFeaturedEntryProps } from "~types/changelog";

export function ChangelogFeaturedEntry({
  item,
  label = "Latest",
}: ChangelogFeaturedEntryProps) {
  return (
    <Link
      className="group block w-full overflow-clip rounded-3xl bg-white ring-1 ring-[#ECECEC] transition-shadow hover:ring-[#1E1E1E1A] dark:bg-white/[0.03] dark:ring-white/10"
      href={item.href}
    >
      <div
        className="relative flex h-56 items-center justify-center overflow-clip sm:h-72"
        style={{ backgroundImage: CHANGELOG_FEATURED_GRADIENT }}
      >
        <div className="absolute inset-0 hidden bg-white/[0.04] dark:block" />
        <div
          className="-rotate-3 absolute top-8 left-8 flex items-center gap-4 rounded-2xl bg-white px-6 py-5 ring-1 ring-[#1E1E1E0D] sm:left-12"
          style={{ boxShadow: "#28282818 0px 10px 28px -6px" }}
        >
          <NotraMark className="size-9 shrink-0" />
          <div className="flex flex-col gap-1.75">
            <div className="h-2.25 w-42.5 rounded-[0.3125rem] bg-[#E9E4DA]" />
            <div className="h-2.25 w-32.5 rounded-[0.3125rem] bg-[#EFEBE2]" />
            <div className="h-2.25 w-37.5 rounded-[0.3125rem] bg-[#EFEBE2]" />
          </div>
        </div>
        <div
          className="absolute right-8 bottom-12 flex max-w-[19rem] rotate-2 flex-col gap-2.5 rounded-2xl bg-white px-6 py-5 ring-1 ring-[#1E1E1E0D] sm:right-16"
          style={{ boxShadow: "#28282824 0px 16px 40px -10px" }}
        >
          <p className="font-medium font-sans text-[#1E1E1E] text-sm leading-[1.5] tracking-[-0.005em]">
            &ldquo;We cut our publishing time from days to minutes. Notra just
            gets our voice.&rdquo;
          </p>
          <div className="flex items-center gap-2">
            <span
              className="size-5.5 shrink-0 rounded-full"
              style={{ backgroundImage: CHANGELOG_ACCENT_GRADIENT }}
            />
            <span className="font-sans text-[#1E1E1E80] text-xs">
              Mia Chen · Head of Growth
            </span>
          </div>
        </div>
        <div
          className="-rotate-2 absolute bottom-8 left-1/2 flex items-center rounded-full bg-[#1E1E1E] px-4 py-2"
          style={{ boxShadow: "#28282833 0px 12px 28px -8px" }}
        >
          <span className="font-display font-medium text-[0.8125rem] text-white leading-[1.3]">
            Draft ready · Customer story
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 pt-7 pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-12 sm:px-10 sm:pb-10">
        <div className="flex flex-col gap-3 sm:max-w-[36rem]">
          <div className="flex items-center gap-2.5">
            <span className="font-sans font-semibold text-primary text-sm">
              {label}
            </span>
            <span className="font-sans text-[#1E1E1E80] text-sm dark:text-white/40">
              {formatChangelogDate(item.date)}
            </span>
          </div>
          <h2 className="font-display font-semibold text-2xl text-[#1E1E1E] tracking-[-0.02em] transition-colors group-hover:text-primary sm:text-4xl dark:text-white">
            {item.title}
          </h2>
          <p className="font-sans text-[#1E1E1EBF] text-base leading-[1.6] tracking-[-0.005em] dark:text-white/70">
            {item.description}
          </p>
        </div>
        <span className="cta-gradient-primary inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-6 py-2.75 font-display font-semibold text-sm text-white ring-1 ring-[#1E1E1E1A] sm:self-auto">
          Read the post
          <HugeiconsIcon className="size-4" icon={ArrowRight01Icon} />
        </span>
      </div>
    </Link>
  );
}
