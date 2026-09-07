"use client";

import { GEO_SENTIMENT_LABELS } from "@notra/geo-core/constants/geo-sentiment";
import { Button } from "@notra/ui/components/ui/button";

import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import { InstrumentModule } from "@/components/instrument/instrument-module";
import {
  SENTIMENT_CHART_CONFIG,
  SENTIMENT_METHODOLOGY,
  SENTIMENT_PERCENT,
} from "@/constants/geo-sentiment";
import { useGeoSentiment } from "@/lib/hooks/use-geo-sentiment";
import type {
  BrandSentimentCardProps,
  SentimentShareProps,
} from "@/types/geo-sentiment";
import { formatEngineFamily } from "@/utils/geo-charts";

import { SentimentEvidence } from "./sentiment-evidence-list";

function SentimentShare({ value }: SentimentShareProps) {
  return value === null ? "—" : SENTIMENT_PERCENT.format(value);
}

export function BrandSentimentCard({
  organizationId,
  isScanning,
}: BrandSentimentCardProps) {
  const query = useGeoSentiment(organizationId);
  const data = query.data;
  return (
    <InstrumentModule
      eyebrow="Brand sentiment"
      variant="table"
      bodyClassName="space-y-4"
    >
      <p className="text-muted-foreground text-xs">{SENTIMENT_METHODOLOGY}</p>
      {isScanning ? (
        <p className="text-muted-foreground text-sm" role="status">
          Scan in progress. Persisted answers may be incomplete.
        </p>
      ) : null}
      {query.isPending ? <p role="status">Loading brand sentiment…</p> : null}
      {query.isError ? (
        <div role="alert">
          <p>Could not load brand sentiment.</p>
          <Button onClick={() => query.refetch()} variant="outline">
            Try again
          </Button>
        </div>
      ) : null}
      {query.isSuccess && data ? (
        <>
          {data.summary.totalChecks === 0 ? (
            <p className="text-muted-foreground text-sm">
              {isScanning
                ? "Waiting for answers in this period."
                : "No answers in this period. Run a scan or select a wider date range."}
            </p>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-medium tabular-nums">
                      <SentimentShare value={data.summary.positiveShare} />
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Positive · of {data.summary.classifiedMentions} classified
                      mentions
                    </p>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    {GEO_SENTIMENT_LABELS.map((label) => (
                      <div key={label}>
                        <dt className="capitalize">{label}</dt>
                        <dd className="tabular-nums">
                          {data.summary[label]} ·{" "}
                          <SentimentShare
                            value={data.summary[`${label}Share`]}
                          />
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-muted-foreground text-xs">
                    {data.summary.totalChecks} answers · {data.summary.mentions}{" "}
                    mentions · {data.summary.notMentioned} not mentioned
                    <br />
                    Classification coverage:{" "}
                    <SentimentShare
                      value={data.summary.classificationCoverage}
                    />{" "}
                    · {data.summary.unknownMentions} unknown labels
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="mb-2 text-sm font-medium">
                    Daily positive share (UTC)
                  </p>
                  <EChartsAreaChart
                    animation={false}
                    className="h-48 w-full"
                    config={SENTIMENT_CHART_CONFIG}
                    curveType="linear"
                    data={data.points.map((point) => ({
                      ...point,
                      tooltip: `${point.day} · ${point.classifiedMentions} classified mentions`,
                    }))}
                    xDataKey="day"
                  >
                    <EChartsAreaChart.Grid variant="solid" />
                    <EChartsAreaChart.XAxis dataKey="day" />
                    <EChartsAreaChart.YAxis
                      tickFormatter={SENTIMENT_PERCENT.format}
                    />
                    <EChartsAreaChart.Area
                      dataKey="positiveShare"
                      gapMissing
                      variant="gradient"
                    />
                    <EChartsAreaChart.Tooltip
                      labelKey="tooltip"
                      hideZeros={false}
                      valueFormatter={SENTIMENT_PERCENT.format}
                    />
                  </EChartsAreaChart>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm tabular-nums">
                  <caption className="pb-2 text-left font-medium">
                    Sentiment by engine
                  </caption>
                  <thead>
                    <tr>
                      <th className="py-2 pr-4" scope="col">
                        Engine
                      </th>
                      <th scope="col">Classified</th>
                      <th scope="col">Positive</th>
                      <th scope="col">Neutral</th>
                      <th scope="col">Negative</th>
                      <th scope="col">Unknown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.engines.map((engine) => (
                      <tr className="border-t" key={engine.engine}>
                        <th className="py-2 pr-4 font-normal" scope="row">
                          {formatEngineFamily(engine.engine)}
                          <span className="text-muted-foreground block text-xs">
                            {engine.engine}
                          </span>
                        </th>
                        <td className="pr-4">{engine.classifiedMentions}</td>
                        {GEO_SENTIMENT_LABELS.map((label) => (
                          <td className="pr-4 whitespace-nowrap" key={label}>
                            {engine[label]} ·{" "}
                            <SentimentShare value={engine[`${label}Share`]} />
                          </td>
                        ))}
                        <td>{engine.unknownMentions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer py-2">Daily values</summary>
                <ul>
                  {data.points.map((point) => (
                    <li className="py-1 tabular-nums" key={point.day}>
                      {point.day}:{" "}
                      <SentimentShare value={point.positiveShare} /> positive ·{" "}
                      {point.classifiedMentions} classified mentions
                    </li>
                  ))}
                </ul>
              </details>
              <p className="text-muted-foreground text-xs">
                Last measured:{" "}
                {data.summary.lastCheckedAt
                  ?.replace("T", " ")
                  .replace("Z", " UTC")}
                . Each saved answer has equal weight; repeated scans count
                again. Changes to prompts, engines or the judge can change this
                distribution.
              </p>
            </>
          )}
          <SentimentEvidence
            negativeCount={data.summary.negative}
            organizationId={organizationId}
          />
        </>
      ) : null}
    </InstrumentModule>
  );
}
