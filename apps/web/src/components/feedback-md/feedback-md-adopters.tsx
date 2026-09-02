import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { FEEDBACK_MD_ADOPTERS } from "@/lib/feedback-md/constants";

export function FeedbackMdAdopters() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FEEDBACK_MD_ADOPTERS.map(({ name, label, feedbackUrl, Logo }) => {
        const displayUrl = feedbackUrl.replace(/^https?:\/\/(www\.)?/, "");
        return (
          <li key={name}>
            <Link
              className="group flex h-full flex-col justify-between gap-8 rounded-2xl border border-[#1E1E1E1F] p-5 transition-colors hover:bg-[#1E1E1E05] dark:border-white/10 dark:hover:bg-white/5"
              href={feedbackUrl}
              rel="noopener"
              target="_blank"
            >
              <Logo
                aria-hidden="true"
                className="h-7 w-auto shrink-0 self-start text-[#1E1E1E] dark:text-white"
              />
              <span className="flex items-end justify-between gap-3">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-sans text-[0.9375rem] leading-[1.36] font-medium text-[#1E1E1E] dark:text-white">
                    {label}
                  </span>
                  <span className="truncate font-mono text-[0.75rem] leading-4 text-[#1E1E1EA6] dark:text-white/60">
                    {displayUrl}
                  </span>
                </span>
                <HugeiconsIcon
                  className="size-3.5 shrink-0 text-[#1E1E1EA6] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-white/60"
                  icon={ArrowUpRight01Icon}
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
