"use client";

import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AnalyticsNavProps } from "@/types/analytics";

export function AnalyticsNav({ slug }: AnalyticsNavProps) {
  const pathname = usePathname();
  const base = `/${slug}/analytics`;
  const value = pathname.startsWith(`${base}/leaderboard`)
    ? "leaderboard"
    : "overview";

  return (
    <Tabs value={value}>
      <TabsList variant="line">
        <TabsTrigger
          nativeButton={false}
          render={<Link href={base} />}
          value="overview"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          nativeButton={false}
          render={<Link href={`${base}/leaderboard`} />}
          value="leaderboard"
        >
          Leaderboard
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
