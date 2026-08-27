"use client";

import { Cancel01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Card } from "@notra/ui/components/ui/card";
import { Google } from "@notra/ui/components/ui/svgs/google";
import { useId } from "react";

import { Button } from "@/components/button";
import { StatusSpinner } from "@/components/geo/status-spinner";
import {
  useGeoSuggestionAccept,
  useGeoSuggestionDismiss,
  useGeoSuggestions,
  useGeoSuggestionsAcceptAll,
  useGscAnalyzing,
} from "@/lib/hooks/use-geo";
import { cn } from "@/lib/utils";
import type {
  PromptSuggestionsProps,
  SuggestionEvidenceProps,
  SuggestionRowProps,
  SuggestionStatusRowProps,
} from "@/types/components/geo";
import type { GeoSuggestionKeyword } from "@/types/geo";

const MAX_VISIBLE_KEYWORDS = 4;

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function countedLabel(count: number, singular: string, plural: string): string {
  return `${compactNumber.format(count)} ${count === 1 ? singular : plural}`;
}

function keywordMetrics(
  impressions: number,
  clicks: number,
  position: number,
  positionLabel = "position"
): string {
  return `${countedLabel(impressions, "impression", "impressions")} · ${countedLabel(clicks, "click", "clicks")} · ${positionLabel} ${position.toFixed(1)}`;
}

function keywordTitle(keyword: GeoSuggestionKeyword): string {
  return keywordMetrics(keyword.impressions, keyword.clicks, keyword.position);
}

function summarize(keywords: GeoSuggestionKeyword[]): string {
  if (keywords.length === 0) {
    return "No ranking queries yet";
  }
  let impressions = 0;
  let clicks = 0;
  let bestPosition = Number.POSITIVE_INFINITY;
  for (const keyword of keywords) {
    impressions += keyword.impressions;
    clicks += keyword.clicks;
    if (keyword.position < bestPosition) {
      bestPosition = keyword.position;
    }
  }
  return keywordMetrics(
    impressions,
    clicks,
    bestPosition,
    keywords.length === 1 ? "position" : "best position"
  );
}

function StatusRow({
  action,
  description,
  icon,
  title,
  titleId,
}: SuggestionStatusRowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug font-medium" id={titleId}>
          {title}
        </p>
        <p className="text-muted-foreground text-sm leading-snug">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function SuggestionEvidence({ keywords }: SuggestionEvidenceProps) {
  const visible = keywords.slice(0, MAX_VISIBLE_KEYWORDS);
  const hidden = keywords.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {visible.map((keyword) => (
        <Badge
          className="font-normal"
          key={keyword.query}
          title={keywordTitle(keyword)}
          variant="secondary"
        >
          {keyword.query}
        </Badge>
      ))}
      {hidden > 0 ? (
        <span className="text-muted-foreground text-xs">+{hidden} more</span>
      ) : null}
      <span className="text-muted-foreground text-xs">
        {summarize(keywords)}
      </span>
    </div>
  );
}

function SuggestionRow({
  checking,
  organizationId,
  suggestion,
}: SuggestionRowProps) {
  const accept = useGeoSuggestionAccept(organizationId);
  const dismiss = useGeoSuggestionDismiss(organizationId);
  const busy = checking || accept.isPending || dismiss.isPending;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm leading-snug font-medium">{suggestion.prompt}</p>
        <SuggestionEvidence keywords={suggestion.keywords} />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          disabled={busy}
          onClick={() => accept.mutate({ suggestionId: suggestion.id })}
          size="sm"
          variant="outline"
        >
          {accept.isPending ? (
            <StatusSpinner />
          ) : (
            <HugeiconsIcon icon={PlusSignIcon} size={14} />
          )}
          {accept.isPending ? "Adding…" : "Track"}
        </Button>
        <Button
          aria-label="Dismiss suggestion"
          disabled={busy}
          onClick={() => dismiss.mutate({ suggestionId: suggestion.id })}
          size="icon-sm"
          variant="ghost"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} />
        </Button>
      </div>
    </div>
  );
}

export function PromptSuggestions({ organizationId }: PromptSuggestionsProps) {
  const headingId = useId();
  const { data } = useGeoSuggestions(organizationId);
  const checking = useGscAnalyzing(organizationId);
  const acceptAll = useGeoSuggestionsAcceptAll(organizationId);
  const suggestions = data?.suggestions ?? [];
  const hasSuggestions = suggestions.length > 0;

  if (!checking && !hasSuggestions) {
    return null;
  }

  const headerAction =
    !checking && suggestions.length > 1 ? (
      <Button
        disabled={acceptAll.isPending}
        onClick={() => acceptAll.mutate()}
        size="sm"
        variant="outline"
      >
        {acceptAll.isPending ? (
          <StatusSpinner />
        ) : (
          <HugeiconsIcon icon={PlusSignIcon} size={14} />
        )}
        {acceptAll.isPending ? "Adding…" : `Track all (${suggestions.length})`}
      </Button>
    ) : null;

  return (
    <Card
      aria-busy={checking}
      aria-labelledby={headingId}
      className="gap-0 py-0"
      role="region"
    >
      {checking ? (
        <output className="block">
          <StatusRow
            description="Looking through queries your site already ranks for."
            icon={<StatusSpinner />}
            title="Checking for prompt suggestions…"
            titleId={headingId}
          />
        </output>
      ) : (
        <StatusRow
          action={headerAction}
          description="You already rank for these searches. Track how AI assistants answer the same questions."
          icon={
            <span className="inline-flex size-5 items-center justify-center">
              <Google className="size-4" />
            </span>
          }
          title="Suggested from Google Search"
          titleId={headingId}
        />
      )}
      {hasSuggestions ? (
        <>
          <div className="border-border/80 mx-4 border-t" />
          <div className={cn(suggestions.length > 1 && "divide-y")}>
            {suggestions.map((suggestion) => (
              <SuggestionRow
                checking={checking}
                key={suggestion.id}
                organizationId={organizationId}
                suggestion={suggestion}
              />
            ))}
          </div>
        </>
      ) : null}
    </Card>
  );
}
