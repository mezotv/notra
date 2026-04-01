"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MARKETPLACE_CATEGORIES } from "@/utils/marketplace";

export function MarketplaceCategoryTabs() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "all";

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      {MARKETPLACE_CATEGORIES.map((cat) => {
        const isActive = cat.value === activeCategory;
        const href =
          cat.value === "all"
            ? "/marketplace"
            : `/marketplace?category=${cat.value}`;

        return (
          <Link
            className={`shrink-0 rounded-full border px-3 py-1 font-sans text-sm transition-colors ${
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
            }`}
            href={href}
            key={cat.value}
          >
            {cat.label}
          </Link>
        );
      })}
    </div>
  );
}
