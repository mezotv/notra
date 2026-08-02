"use client";

import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import { Pie } from "@notra/ui/components/dither-kit/pie";
import { PieChart } from "@notra/ui/components/dither-kit/pie-chart";
import { Tooltip as DitherTooltip } from "@notra/ui/components/dither-kit/tooltip";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { useMemo } from "react";
import {
  AI_TRAFFIC_PURPOSE_DESCRIPTIONS,
  AI_TRAFFIC_PURPOSE_LABELS,
} from "@/constants/geo";
import { cn } from "@/lib/utils";
import type {
  AiTrafficAgent,
  AiTrafficLogEntry,
  AiTrafficResponse,
  BeaconSetupResponse,
} from "@/types/geo";
import { formatAiTrafficTimestamp, hitBarWidth } from "@/utils/ai-traffic";

interface AiTrafficCardProps {
  traffic: AiTrafficResponse | undefined;
  setup: BeaconSetupResponse | undefined;
}

function PurposeBadge({ category }: { category: string }) {
  return (
    <Badge
      title={AI_TRAFFIC_PURPOSE_DESCRIPTIONS[category] ?? category}
      variant="secondary"
    >
      {AI_TRAFFIC_PURPOSE_LABELS[category] ?? category}
    </Badge>
  );
}

function AgentRow({
  agent,
  maxHits,
}: {
  agent: AiTrafficAgent;
  maxHits: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-foreground text-sm">
            {agent.agent}
          </span>
          <PurposeBadge category={agent.category} />
        </span>
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
          last seen {formatAiTrafficTimestamp(agent.lastSeenAt)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/80"
            style={{ width: `${hitBarWidth(agent.hits, maxHits)}%` }}
          />
        </div>
        <span className="w-16 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
          {agent.hits} hits
        </span>
      </div>
    </div>
  );
}

function LogRow({ entry }: { entry: AiTrafficLogEntry }) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-muted-foreground text-xs tabular-nums">
        {formatAiTrafficTimestamp(entry.capturedAt)}
      </TableCell>
      <TableCell className="font-medium text-sm">{entry.agent}</TableCell>
      <TableCell
        className="max-w-[16rem] truncate font-mono text-xs"
        title={entry.path}
      >
        {entry.path}
      </TableCell>
      <TableCell>
        <PurposeBadge category={entry.category} />
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {entry.method}
      </TableCell>
    </TableRow>
  );
}

function BeaconSetup({ setup }: { setup: BeaconSetupResponse | undefined }) {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        No AI agent has been seen on your site yet. Install the beacon to start
        recording hits.
      </p>
      <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
        <code>
          {setup?.snippet ??
            "Set BEACON_INGEST_SECRET to generate your install snippet"}
        </code>
      </pre>
      {setup?.token ? (
        <p className="break-all text-muted-foreground text-xs">
          <span className="font-medium text-foreground">BEACON_ORG_TOKEN</span>{" "}
          <span className="font-mono">{setup.token}</span>
        </p>
      ) : null}
    </div>
  );
}

const PURPOSE_DONUT_CONFIG: ChartConfig = {
  "Training data": { label: "Training data", color: "green" },
  "Search index": { label: "Search index", color: "blue" },
  "Used in answer": { label: "Used in answer", color: "purple" },
};

function PurposeDonut({ agents }: { agents: AiTrafficAgent[] }) {
  const rows = useMemo(() => {
    const byPurpose = new Map<string, number>();
    for (const agent of agents) {
      const label = AI_TRAFFIC_PURPOSE_LABELS[agent.category] ?? agent.category;
      byPurpose.set(label, (byPurpose.get(label) ?? 0) + agent.hits);
    }
    return [...byPurpose.entries()].map(([purpose, hits]) => ({
      purpose,
      hits,
    }));
  }, [agents]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">Requests by purpose</p>
      <PieChart
        className="h-40 w-full"
        config={PURPOSE_DONUT_CONFIG}
        data={rows}
        dataKey="hits"
        innerRadius={0.55}
        nameKey="purpose"
      >
        <Pie />
        <DitherTooltip inlineHeading />
      </PieChart>
    </div>
  );
}

export function AiTrafficCard({ traffic, setup }: AiTrafficCardProps) {
  const agents = traffic?.agents ?? [];
  const log = traffic?.log ?? [];
  const maxHits = useMemo(
    () => agents.reduce((max, agent) => Math.max(max, agent.hits), 0),
    [agents]
  );
  const totalHits = useMemo(
    () => agents.reduce((sum, agent) => sum + agent.hits, 0),
    [agents]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI traffic to your site</CardTitle>
        <CardDescription>
          {agents.length > 0
            ? `${totalHits} requests from ${agents.length} AI agents in the last 30 days`
            : "Which AI crawlers and assistants fetch your pages, and what they came for"}
        </CardDescription>
      </CardHeader>
      <CardContent className={cn(agents.length > 0 && "space-y-6")}>
        {agents.length === 0 ? (
          <BeaconSetup setup={setup} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
            <div className="space-y-4">
              {agents.map((agent) => (
                <AgentRow agent={agent} key={agent.agent} maxHits={maxHits} />
              ))}
            </div>
            <PurposeDonut agents={agents} />
          </div>
        )}

        {log.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium text-sm">Recent requests</p>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:first-child>td:first-child]:rounded-tl-none [&_tr:first-child>td:last-child]:rounded-tr-none">
                  {log.map((entry) => (
                    <LogRow
                      entry={entry}
                      key={`${entry.capturedAt}-${entry.agent}-${entry.path}`}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
