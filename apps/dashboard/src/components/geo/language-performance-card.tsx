"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { useMemo } from "react";
import type { GeoLanguagePerformanceCardProps } from "@/types/geo";
import {
  geoLanguageLabel,
  summarizeLanguagePerformance,
} from "@/utils/geo-languages";

const PERCENT = 100;

export function LanguagePerformanceCard({
  results,
}: GeoLanguagePerformanceCardProps) {
  const rows = useMemo(() => summarizeLanguagePerformance(results), [results]);

  if (rows.length < 2) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance by language</CardTitle>
        <CardDescription>
          How often AI engines mention you when the question is asked in each
          language
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {rows.map((row) => (
            <div className="flex items-center gap-3 py-2.5" key={row.language}>
              <span className="w-24 shrink-0 font-medium text-sm">
                {geoLanguageLabel(row.language)}
              </span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round(row.mentionRate * PERCENT)}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-muted-foreground text-sm">
                {Math.round(row.mentionRate * PERCENT)}% · {row.mentions}/
                {row.checks} checks
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
