"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { useMemo } from "react";
import { PresenceBadge } from "@/components/geo/presence-badge";
import { GEO_DEFAULT_LANGUAGE, GEO_ENGINE_LABELS } from "@/constants/geo";
import type { GeoPromptResult, GeoPromptResultGroup } from "@/types/geo";
import { geoLanguageLabel } from "@/utils/geo-languages";
import { classifyPromptPresence } from "@/utils/geo-presence";

interface PromptResultsCardProps {
  results: GeoPromptResult[];
}

function groupByPrompt(results: GeoPromptResult[]): GeoPromptResultGroup[] {
  const groups = new Map<string, GeoPromptResultGroup>();
  for (const result of results) {
    const key = `${result.promptId}:${result.language}`;
    const group = groups.get(key) ?? {
      promptId: result.promptId,
      language: result.language,
      prompt: result.prompt,
      results: [],
    };
    group.results.push(result);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function ResultBadge({ result }: { result: GeoPromptResult }) {
  const label = GEO_ENGINE_LABELS[result.engine] ?? result.engine;
  if (!result.mentioned) {
    return (
      <Badge className="text-muted-foreground" variant="outline">
        {label} · not mentioned
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      {label}
      {result.position !== null && ` · #${result.position}`}
      {result.sentiment === "positive" && " · positive"}
      {result.sentiment === "negative" && " · negative"}
    </Badge>
  );
}

export function PromptResultsCard({ results }: PromptResultsCardProps) {
  const groups = useMemo(() => groupByPrompt(results), [results]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompt results</CardTitle>
        <CardDescription>
          Latest answer per prompt across every engine
        </CardDescription>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="flex h-40 items-center justify-center text-muted-foreground text-sm">
            Run a scan to see how AI engines answer these prompts
          </p>
        ) : (
          <div className="divide-y">
            {groups.map((group) => {
              const mentionedResult = group.results.find(
                (result) => result.mentioned && result.excerpt
              );
              return (
                <div
                  className="space-y-2 py-3"
                  key={`${group.promptId}:${group.language}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="min-w-0 font-medium text-sm">
                        {group.prompt}
                      </p>
                      {group.language !== GEO_DEFAULT_LANGUAGE && (
                        <Badge className="shrink-0" variant="outline">
                          {geoLanguageLabel(group.language)}
                        </Badge>
                      )}
                    </div>
                    <PresenceBadge
                      status={classifyPromptPresence(group.results)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.results.map((result) => (
                      <ResultBadge
                        key={`${group.promptId}:${group.language}:${result.engine}`}
                        result={result}
                      />
                    ))}
                  </div>
                  {mentionedResult && (
                    <p className="text-muted-foreground text-xs italic">
                      "{mentionedResult.excerpt}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
