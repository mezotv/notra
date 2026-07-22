import Link from "next/link";
import { ChangelogRowVisual } from "@/components/changelog-row-visual";
import { getChangelogRowGradient } from "@/lib/changelog/gradients";
import { formatChangelogDate } from "@/utils/changelog";
import type { ChangelogRowProps } from "~types/changelog";

export function ChangelogRow({ item, index }: ChangelogRowProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
      <div className="flex shrink-0 items-baseline gap-3 pt-0 sm:w-37.5 sm:flex-col sm:gap-1 sm:pt-2">
        <span className="font-display font-medium text-[#1E1E1E] text-[0.9375rem] leading-[1.33] tracking-[-0.01em] dark:text-white">
          {formatChangelogDate(item.date)}
        </span>
      </div>
      <Link
        className="group flex grow flex-col overflow-clip rounded-[1.25rem] bg-white ring-1 ring-[#ECECEC] transition-shadow hover:ring-[#1E1E1E1A] sm:flex-row dark:bg-white/[0.03] dark:ring-white/10"
        href={item.href}
      >
        <ChangelogRowVisual
          gradient={getChangelogRowGradient(index)}
          index={index}
        />
        <div className="flex flex-col justify-center gap-2 px-6 py-6 sm:px-7">
          <h3 className="font-display font-semibold text-[#1E1E1E] text-xl leading-[1.3] tracking-[-0.015em] transition-colors group-hover:text-primary dark:text-white">
            {item.title}
          </h3>
          <p className="font-sans text-[#1E1E1EBF] text-sm leading-[1.5] tracking-[-0.005em] dark:text-white/70">
            {item.description}
          </p>
        </div>
      </Link>
    </div>
  );
}
