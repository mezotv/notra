"use client";

import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import { PALETTE, rgb } from "@notra/ui/components/dither-kit/palette";
import { Pie } from "@notra/ui/components/dither-kit/pie";
import { PieChart } from "@notra/ui/components/dither-kit/pie-chart";
import { Tooltip } from "@notra/ui/components/dither-kit/tooltip";
import { useMemo } from "react";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
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

  const { rows, config, total, caption } = useMemo(() => {
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
    const shareTotal = shareRows.reduce((sum, row) => sum + row.impressions, 0);
    const top = shareRows.reduce<ShareRow | null>(
      (best, row) =>
        best === null || row.impressions > best.impressions ? row : best,
      null
    );
    return {
      rows: shareRows,
      config: shareConfig,
      total: shareTotal,
      caption:
        top && shareTotal > 0
          ? `${top.account} · ${Math.round((top.impressions / shareTotal) * PERCENT)}% of impressions`
          : null,
    };
  }, [data?.entries]);

  return (
    <InstrumentModule eyebrow="Impressions share">
      {rows.length === 0 ? (
        <InstrumentEmpty
          className="h-56"
          message="No impression data yet"
          seed="Impressions share"
        />
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex flex-1 items-center gap-4">
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
                  className="flex items-center gap-1.5 font-mono text-xs"
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
          {caption && (
            <p className="mt-2 truncate text-[0.6875rem] text-muted-foreground">
              {caption}
            </p>
          )}
        </div>
      )}
    </InstrumentModule>
  );
}
