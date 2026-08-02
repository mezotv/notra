"use client";

import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import { Pie } from "@notra/ui/components/dither-kit/pie";
import { PieChart } from "@notra/ui/components/dither-kit/pie-chart";
import { Tooltip as DitherTooltip } from "@notra/ui/components/dither-kit/tooltip";
import { useMemo } from "react";
import { PurposeBadge } from "@/components/geo/purpose-badge";
import { InstrumentModule } from "@/components/instrument/instrument-module";
import { AI_TRAFFIC_PURPOSE_LABELS } from "@/constants/geo";
import type {
  AiTrafficAgent,
  AiTrafficResponse,
  BeaconSetupResponse,
} from "@/types/geo";
import { formatAiTrafficTimestamp, hitBarWidth } from "@/utils/ai-traffic";

interface AiTrafficCardProps {
  traffic: AiTrafficResponse | undefined;
  setup: BeaconSetupResponse | undefined;
}

function AgentRow({
  agent,
  maxHits,
}: {
  agent: AiTrafficAgent;
  maxHits: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-foreground text-sm">
            {agent.agent}
          </span>
          <PurposeBadge category={agent.category} />
        </span>
        <span className="shrink-0 font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
          last seen {formatAiTrafficTimestamp(agent.lastSeenAt)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden bg-muted">
          <div
            className="h-full bg-foreground/80"
            style={{ width: `${hitBarWidth(agent.hits, maxHits)}%` }}
          />
        </div>
        <span className="w-16 shrink-0 text-right font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
          {agent.hits} hits
        </span>
      </div>
    </div>
  );
}

function BeaconSetup({ setup }: { setup: BeaconSetupResponse | undefined }) {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        No AI agent has been seen on your site yet. Install the beacon to start
        recording hits.
      </p>
      <pre className="overflow-x-auto rounded-sm border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
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
      <p className="font-mono text-[0.625rem] text-muted-foreground uppercase tracking-[0.14em]">
        Requests by purpose
      </p>
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
  const maxHits = useMemo(
    () => agents.reduce((max, agent) => Math.max(max, agent.hits), 0),
    [agents]
  );
  const totalHits = useMemo(
    () => agents.reduce((sum, agent) => sum + agent.hits, 0),
    [agents]
  );

  return (
    <InstrumentModule
      eyebrow="AI traffic to your site"
      readout={
        agents.length > 0
          ? `${totalHits} requests · ${agents.length} agents · 30D`
          : "crawlers and assistants fetching your pages"
      }
    >
      {agents.length === 0 ? (
        <BeaconSetup setup={setup} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
          <div className="space-y-3">
            {agents.map((agent) => (
              <AgentRow agent={agent} key={agent.agent} maxHits={maxHits} />
            ))}
          </div>
          <PurposeDonut agents={agents} />
        </div>
      )}
    </InstrumentModule>
  );
}
