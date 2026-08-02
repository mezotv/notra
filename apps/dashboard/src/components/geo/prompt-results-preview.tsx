"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { Card, CardContent } from "@notra/ui/components/ui/card";
import { useMemo } from "react";
import { PresenceBadge } from "@/components/geo/presence-badge";
import type { GeoPresenceStatus, GeoPromptResult } from "@/types/geo";
import { classifyPromptPresence } from "@/utils/geo-presence";

interface PromptResultsPreviewProps {
  results: GeoPromptResult[];
  limit?: number;
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
}: PromptResultsPreviewProps) {
  const summaries = useMemo(() => summarize(results), [results]);

  if (summaries.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground text-sm">
            Run a scan to see which prompts surface you
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="divide-y py-2">
        {summaries.slice(0, limit).map((summary) => (
          <div
            className="flex items-center gap-3 py-2.5"
            key={summary.promptId}
          >
            <p className="min-w-0 flex-1 truncate text-sm">{summary.prompt}</p>
            <PresenceBadge status={summary.presence} />
            {summary.bestPosition !== null && (
              <Badge variant="outline">#{summary.bestPosition}</Badge>
            )}
            <span className="shrink-0 text-muted-foreground text-sm tabular-nums">
              {summary.mentioned}/{summary.total} engines
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
