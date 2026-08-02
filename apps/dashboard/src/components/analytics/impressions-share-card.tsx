"use client";

import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import { PALETTE, rgb } from "@notra/ui/components/dither-kit/palette";
import { Pie } from "@notra/ui/components/dither-kit/pie";
import { PieChart } from "@notra/ui/components/dither-kit/pie-chart";
import { Tooltip } from "@notra/ui/components/dither-kit/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { useMemo } from "react";
import { ACCOUNT_SERIES_COLORS } from "@/constants/analytics";
import { useLeaderboard } from "@/lib/hooks/use-social-analytics";

interface ImpressionsShareCardProps {
  organizationId: string;
}

interface ShareRow {
  account: string;
  impressions: number;
}

const DONUT_INNER_RADIUS = 0.55;
const WINDOW_DAYS = 30;
const PERCENT = 100;

export function ImpressionsShareCard({
  organizationId,
}: ImpressionsShareCardProps) {
  const { data } = useLeaderboard(organizationId, WINDOW_DAYS);

  const { rows, config, total } = useMemo(() => {
    const shareRows: ShareRow[] = (data?.entries ?? [])
      .filter((entry) => (entry.impressions ?? 0) > 0)
      .map((entry) => ({
        account: `@${entry.username}`,
        impressions: entry.impressions ?? 0,
      }));
    const shareConfig: ChartConfig = {};
    shareRows.forEach((row, index) => {
      shareConfig[row.account] = {
        label: row.account,
        color:
          ACCOUNT_SERIES_COLORS[index % ACCOUNT_SERIES_COLORS.length] ?? "blue",
      };
    });
    return {
      rows: shareRows,
      config: shareConfig,
      total: shareRows.reduce((sum, row) => sum + row.impressions, 0),
    };
  }, [data?.entries]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impressions share</CardTitle>
        <CardDescription>
          Who pulls the reach across every account, last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="flex h-56 items-center justify-center text-muted-foreground text-sm">
            No impression data yet
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <PieChart
              className="h-56 w-1/2 min-w-0"
              config={config}
              data={rows}
              dataKey="impressions"
              innerRadius={DONUT_INNER_RADIUS}
              nameKey="account"
            >
              <Pie />
              <Tooltip inlineHeading />
            </PieChart>
            <div className="min-w-0 flex-1 space-y-1.5">
              {rows.map((row) => (
                <div
                  className="flex items-center gap-1.5 text-sm"
                  key={row.account}
                >
                  <span
                    className="size-2 shrink-0 rounded-[0.0625rem]"
                    style={{
                      backgroundColor: rgb(
                        PALETTE[config[row.account]?.color ?? "grey"].fill
                      ),
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {row.account}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {total > 0
                      ? `${Math.round((row.impressions / total) * PERCENT)}%`
                      : "0%"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
