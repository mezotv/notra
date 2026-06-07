"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { BlogTabsNavProps } from "~types/blog";

const PILL_LAYOUT_ID = "blog-tab-pill";

const PILL_TRANSITION = {
  type: "spring",
  stiffness: 380,
  damping: 32,
} as const;

export function BlogTabsNav({ tabs }: BlogTabsNavProps) {
  const pathname = usePathname();
  const activeKey =
    tabs.find((tab) => tab.href === pathname)?.key ?? tabs[0]?.key;

  return (
    <nav
      aria-label="Blog categories"
      className="-mx-1 flex w-full items-center gap-1 overflow-x-auto pb-1"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;

        return (
          <Link
            className="relative shrink-0 rounded-full px-4 py-2 font-medium font-sans text-sm transition-colors"
            href={tab.href}
            key={tab.key}
          >
            {isActive ? (
              <motion.span
                className="absolute inset-0 rounded-full bg-foreground"
                layoutId={PILL_LAYOUT_ID}
                transition={PILL_TRANSITION}
              />
            ) : null}
            <span
              className={`relative z-10 ${
                isActive
                  ? "text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
