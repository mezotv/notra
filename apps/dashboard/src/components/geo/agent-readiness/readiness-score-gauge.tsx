"use client";

import { cn } from "@/lib/utils";
import type { AgentReadinessScoreBandKey } from "@/types/agent-readiness";
import { getAgentReadinessScoreBand } from "@/utils/agent-readiness";

const GAUGE_SIZE = 120;
const GAUGE_STROKE = 8;
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_STROKE) / 2;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

const BAND_TEXT_CLASS: Record<AgentReadinessScoreBandKey, string> = {
  great: "text-emerald-500",
  "needs-improvement": "text-amber-500",
  poor: "text-red-500",
};

/** Lighthouse-style circular score ring, colored by band. */
export function AgentReadinessScoreGauge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const band = getAgentReadinessScoreBand(score);
  const clamped = Math.max(0, Math.min(score, 100));
  const filled = (clamped / 100) * GAUGE_CIRCUMFERENCE;

  return (
    <div
      aria-label={`Readiness score ${score} out of 100 — ${band.label}`}
      className={cn(
        "relative size-28 shrink-0",
        BAND_TEXT_CLASS[band.key],
        className
      )}
      role="img"
    >
      <svg
        aria-hidden="true"
        className="size-full -rotate-90"
        viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
      >
        <circle
          className="opacity-15"
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          fill="none"
          r={GAUGE_RADIUS}
          stroke="currentColor"
          strokeWidth={GAUGE_STROKE}
        />
        <circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          fill="none"
          r={GAUGE_RADIUS}
          stroke="currentColor"
          strokeDasharray={`${filled} ${GAUGE_CIRCUMFERENCE - filled}`}
          strokeLinecap="round"
          strokeWidth={GAUGE_STROKE}
          style={{ transition: "stroke-dasharray 600ms ease" }}
        />
      </svg>
      <span className="text-foreground absolute inset-0 flex items-center justify-center text-3xl font-bold tracking-tight tabular-nums">
        {score}
      </span>
    </div>
  );
}
