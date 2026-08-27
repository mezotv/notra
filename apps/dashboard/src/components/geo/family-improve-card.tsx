"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/button";
import { GEO_FAMILY_IMPROVE_CTA_GAPS } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { FamilyImproveCardProps } from "@/types/geo";

export function FamilyImproveCard({
  insight,
  gapsHref,
}: FamilyImproveCardProps) {
  return (
    <section className="space-y-3 rounded-2xl border px-4 py-3.5">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{insight.title}</h3>
        <p className="text-muted-foreground text-xs leading-relaxed text-pretty">
          {insight.body}
        </p>
      </div>
      {gapsHref ? (
        <Link
          className={cn(buttonVariants({ size: "sm" }))}
          href={gapsHref}
          prefetch={true}
        >
          {GEO_FAMILY_IMPROVE_CTA_GAPS}
        </Link>
      ) : null}
    </section>
  );
}
