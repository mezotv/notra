import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { formatChangelogDate } from "@/utils/changelog";
import type { ChangelogFeaturedEntryProps } from "~types/changelog";

export function ChangelogFeaturedEntry({
  item,
  label = "Latest",
}: ChangelogFeaturedEntryProps) {
  return (
    <Link
      className="group block w-full overflow-clip rounded-3xl bg-[#C8B2EE40] ring-1 ring-[#1E1E1E1A] transition-colors hover:ring-[#1E1E1E33] dark:bg-white/[0.03] dark:ring-white/10 dark:hover:ring-white/20"
      href={item.href}
    >
      <div className="flex flex-col gap-6 px-6 pt-8 pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-12 sm:px-10 sm:pt-10 sm:pb-10">
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
