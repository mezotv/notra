"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { PresenceBadge } from "@/components/geo/presence-badge";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { GEO_LANGUAGE_FLAGS } from "@/constants/geo";
import type { GeoPresenceStatus, GeoPromptResult } from "@/types/geo";
import { classifyPromptPresence } from "@/utils/geo-presence";

interface PromptResultsPreviewProps {
  results: GeoPromptResult[];
  limit?: number;
  action?: ReactNode;
  languages?: string[];
}

interface PromptSummary {
  promptId: string;
  prompt: string;
  mentioned: number;
  total: number;
  bestPosition: number | null;
  presence: GeoPresenceStatus | null;
  results: GeoPromptResult[];
}

const DEFAULT_LIMIT = 3;

function summarize(results: GeoPromptResult[]): PromptSummary[] {
  const groups = new Map<string, PromptSummary>();
  for (const result of results) {
    const group = groups.get(result.promptId) ?? {
      promptId: result.promptId,
      prompt: result.prompt,
      mentioned: 0,
      total: 0,
      bestPosition: null,
      presence: null,
      results: [],
    };
    group.results.push(result);
    group.total += 1;
    if (result.mentioned) {
      group.mentioned += 1;
    }
    if (
      result.position !== null &&
      (group.bestPosition === null || result.position < group.bestPosition)
    ) {
      group.bestPosition = result.position;
    }
    groups.set(result.promptId, group);
  }
  const summaries = [...groups.values()].map((group) => ({
    ...group,
    presence: classifyPromptPresence(group.results),
  }));
  return summaries.sort(
    (a, b) => b.mentioned / b.total - a.mentioned / a.total
  );
}

export function PromptResultsPreview({
  results,
  limit = DEFAULT_LIMIT,
  action,
  languages = [],
}: PromptResultsPreviewProps) {
  const summaries = useMemo(() => summarize(results), [results]);

  return (
    <InstrumentModule
      action={action}
      eyebrow="Winning prompts"
      readout="best surfacing first"
    >
      {summaries.length === 0 ? (
        <InstrumentEmpty
          className="h-24"
          message="Run a scan to see which prompts surface you"
          seed="Winning prompts"
        />
      ) : (
        <div className="divide-y divide-border">
          {summaries.slice(0, limit).map((summary) => (
            <div
              className="flex items-center gap-3 py-2.5"
              key={summary.promptId}
            >
              <p className="min-w-0 flex-1 truncate text-sm">
                {summary.prompt}
              </p>
              {languages.length > 0 && (
                <span className="flex shrink-0 items-center gap-0.5 text-xs">
                  {languages.map((language) => (
                    <span key={language} title={`Also scanned in ${language}`}>
                      {GEO_LANGUAGE_FLAGS[language]}
                    </span>
                  ))}
                </span>
              )}
              <PresenceBadge status={summary.presence} />
              {summary.bestPosition !== null && (
                <Badge
                  className="rounded-sm font-mono tabular-nums"
                  variant="outline"
                >
                  #{summary.bestPosition}
                </Badge>
              )}
              <span className="shrink-0 font-mono text-muted-foreground text-xs tabular-nums">
                {summary.mentioned}/{summary.total} engines
              </span>
            </div>
          ))}
        </div>
      )}
    </InstrumentModule>
  );
}
