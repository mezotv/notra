import { AiScanIcon, Refresh01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@notra/ui/components/ui/skeleton";

import { Button } from "@/components/button";
import { InstrumentModule } from "@/components/instrument/instrument-module";
import {
  AGENT_READINESS_CHECKLIST_PLACEHOLDER_KEYS,
  AGENT_READINESS_GAUGE_CIRCUMFERENCE,
  AGENT_READINESS_GAUGE_RADIUS,
  AGENT_READINESS_GAUGE_SIZE,
  AGENT_READINESS_GAUGE_STROKE,
  AGENT_READINESS_MUST_DO_LABEL,
  AGENT_READINESS_SCANNING_GAUGE_ARC,
  AGENT_READINESS_SHOULD_DO_LABEL,
} from "@/constants/agent-readiness";
import type {
  AgentReadinessScanningBreakdownTileProps,
  AgentReadinessScanningNoticeProps,
} from "@/types/agent-readiness";
import { stripWebsiteProtocol } from "@/utils/geo-website";

/** Same ring as the score gauge, but with an indeterminate spinning arc. */
function ScanningGauge() {
  return (
    <div aria-hidden="true" className="text-primary relative size-28 shrink-0">
      <svg
        className="size-full motion-safe:animate-spin motion-safe:[animation-duration:1.8s]"
        viewBox={`0 0 ${AGENT_READINESS_GAUGE_SIZE} ${AGENT_READINESS_GAUGE_SIZE}`}
      >
        <circle
          className="opacity-15"
          cx={AGENT_READINESS_GAUGE_SIZE / 2}
          cy={AGENT_READINESS_GAUGE_SIZE / 2}
          fill="none"
          r={AGENT_READINESS_GAUGE_RADIUS}
          stroke="currentColor"
          strokeWidth={AGENT_READINESS_GAUGE_STROKE}
        />
        <circle
          cx={AGENT_READINESS_GAUGE_SIZE / 2}
          cy={AGENT_READINESS_GAUGE_SIZE / 2}
          fill="none"
          r={AGENT_READINESS_GAUGE_RADIUS}
          stroke="currentColor"
          strokeDasharray={`${AGENT_READINESS_SCANNING_GAUGE_ARC} ${AGENT_READINESS_GAUGE_CIRCUMFERENCE - AGENT_READINESS_SCANNING_GAUGE_ARC}`}
          strokeLinecap="round"
          strokeWidth={AGENT_READINESS_GAUGE_STROKE}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <HugeiconsIcon
          className="agent-readiness-pulse size-7"
          icon={AiScanIcon}
        />
      </span>
    </div>
  );
}

function ScanningBreakdownTile({
  label,
  hint,
}: AgentReadinessScanningBreakdownTileProps) {
  return (
    <div className="bg-muted/40 flex min-w-0 flex-col gap-2 rounded-xl px-4 py-3">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <Skeleton className="h-6 w-14" />
      <div className="bg-muted-foreground/15 h-1.5 overflow-hidden rounded-full">
        <div className="agent-readiness-progress bg-primary/60 h-full w-1/3 rounded-full" />
      </div>
      <span className="text-muted-foreground text-xs">{hint}</span>
    </div>
  );
}

function ChecklistPlaceholderRow() {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 border-b py-5 last:border-b-0">
      <Skeleton className="mt-0.5 h-4 w-5" />
      <div className="min-w-0 space-y-2.5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-44 max-w-full" />
          <Skeleton className="h-[1.375rem] w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function AgentReadinessScanningNotice({
  targetUrl,
}: AgentReadinessScanningNoticeProps) {
  const domain = stripWebsiteProtocol(targetUrl);

  return (
    <div
      aria-busy="true"
      aria-label={`Scanning ${domain}`}
      aria-live="polite"
      className="flex flex-col gap-6"
    >
      <InstrumentModule
        action={
          <Button disabled size="sm" variant="outline">
            <HugeiconsIcon icon={Refresh01Icon} size={16} />
            Scanning…
          </Button>
        }
        bodyClassName="gap-6 p-6"
        eyebrow="Readiness score"
        variant="table"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex shrink-0 items-center gap-6">
            <ScanningGauge />

            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Scanning <span className="break-all">{domain}</span>…
                </h2>
                <span className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
                  <span className="bg-primary agent-readiness-pulse size-1.5 rounded-full" />
                  In progress
                </span>
              </div>
              <p className="text-muted-foreground">
                Checking how AI agents discover, understand, and use your
                website.
              </p>
              <p className="text-muted-foreground text-sm">
                Usually takes 1–3 minutes
              </p>
            </div>
          </div>

          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3">
            <ScanningBreakdownTile
              hint="checks passing"
              label={AGENT_READINESS_MUST_DO_LABEL}
            />
            <ScanningBreakdownTile
              hint="checks passing"
              label={AGENT_READINESS_SHOULD_DO_LABEL}
            />
            <ScanningBreakdownTile hint="extra signals" label="Bonus" />
          </div>
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t pt-4 text-sm">
          <span>Analyzing public site signals</span>
          <span>This page updates automatically</span>
        </div>
      </InstrumentModule>

      <InstrumentModule
        bodyClassName="gap-0 px-5 pb-2"
        eyebrow="Checklist"
        variant="table"
      >
        <div className="pt-1 pb-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-1.5 h-3.5 w-52 max-w-full" />
        </div>
        {AGENT_READINESS_CHECKLIST_PLACEHOLDER_KEYS.map((key) => (
          <ChecklistPlaceholderRow key={key} />
        ))}
      </InstrumentModule>
    </div>
  );
}
