"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GEO_PROMPT_RECEIPT_COPIED_MESSAGE,
  GEO_PROMPT_RECEIPT_COPY_LABEL,
  GEO_PROMPT_RECEIPT_LABELS,
} from "@notra/geo-core/constants/geo";
import type {
  GeoAnswerSource,
  GeoPromptHistoryCheck,
  GeoPromptResult,
} from "@notra/geo-core/types/geo";
import { formatAiTrafficTimestamp } from "@notra/geo-core/utils/ai-traffic";
import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import type { ReactNode } from "react";

import { Button } from "@/components/button";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { LogoStack } from "@/components/geo/logo-stack";
import { PromptReceiptHistory } from "@/components/geo/prompt-receipt-history";
import { cn } from "@/lib/utils";
import type { PromptReceiptAnalysisProps } from "@/types/geo";
import { copyTextToClipboard } from "@/utils/copy-to-clipboard";
import { formatEngineFamily } from "@/utils/geo-charts";
import {
  buildPromptReceiptText,
  promptCheckLanguage,
  promptHistoryChanges,
  promptOutcomeLabel,
  promptPositionLabel,
  promptSentimentLabel,
  truncateScanId,
} from "@/utils/geo-prompt-history";
import { getSafeReferenceSourceUrl } from "@/utils/reference-source-url";

function sentimentToneClass(sentiment: string | null): string {
  if (sentiment === "positive") {
    return "text-geo-up";
  }
  if (sentiment === "negative") {
    return "text-geo-down";
  }
  return "text-foreground";
}

function OutcomeCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="flex min-h-5 items-center text-sm">{children}</span>
    </div>
  );
}

function CompetitorsCell({ competitors }: { competitors: readonly string[] }) {
  if (competitors.length === 0) {
    return (
      <span className="text-muted-foreground">
        {GEO_PROMPT_RECEIPT_LABELS.noCompetitors}
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <LogoStack
        items={competitors.map((name) => ({
          key: name,
          label: name,
          renderIcon: (className) => (
            <CompetitorLogo className={className} domain={null} name={name} />
          ),
        }))}
      />
      <span className="text-muted-foreground truncate text-xs">
        {competitors.join(", ")}
      </span>
    </span>
  );
}

function OutcomeStrip({ result }: { result: GeoPromptResult }) {
  return (
    <section
      aria-label="Outcome"
      className="grid grid-cols-2 gap-4 rounded-xl border p-4 sm:grid-cols-4"
    >
      <OutcomeCell label="Outcome">
        <Badge
          className="rounded-sm"
          variant={result.mentioned ? "default" : "outline"}
        >
          {promptOutcomeLabel(result.mentioned)}
        </Badge>
      </OutcomeCell>
      <OutcomeCell label={GEO_PROMPT_RECEIPT_LABELS.position}>
        <span className="tabular-nums">
          {promptPositionLabel(result.position)}
        </span>
      </OutcomeCell>
      <OutcomeCell label={GEO_PROMPT_RECEIPT_LABELS.sentiment}>
        <span className={sentimentToneClass(result.sentiment)}>
          {promptSentimentLabel(result.sentiment)}
        </span>
      </OutcomeCell>
      <OutcomeCell label={GEO_PROMPT_RECEIPT_LABELS.competitors}>
        <CompetitorsCell competitors={result.competitors} />
      </OutcomeCell>
    </section>
  );
}

function SearchQueries({ queries }: { queries: readonly string[] }) {
  if (queries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {GEO_PROMPT_RECEIPT_LABELS.noSearches}
      </p>
    );
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {queries.map((query) => (
        <li
          className="bg-muted/60 text-foreground rounded-full border px-2.5 py-1 text-xs"
          key={query}
        >
          {query}
        </li>
      ))}
    </ul>
  );
}

function SourcesTable({ sources }: { sources: readonly GeoAnswerSource[] }) {
  if (sources.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {GEO_PROMPT_RECEIPT_LABELS.noSources}
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Source</TableHead>
            <TableHead className="text-xs">URL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((source) => {
            const href = getSafeReferenceSourceUrl(source.url);
            return (
              <TableRow key={source.url}>
                <TableCell className="max-w-[16rem]">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm">{source.title}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {source.domain}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="max-w-[20rem]">
                  {href ? (
                    <a
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 block truncate rounded-sm text-xs underline-offset-2 outline-none hover:underline focus-visible:ring-2"
                      href={href}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {source.url}
                    </a>
                  ) : (
                    <span className="text-muted-foreground block truncate text-xs">
                      {source.url}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ReceiptSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  );
}

function MetaItem({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{children}</span>
    </span>
  );
}

function ScanIdValue({
  isLoading,
  latest,
}: {
  isLoading: boolean;
  latest: GeoPromptHistoryCheck | null;
}) {
  if (isLoading) {
    return <Skeleton className="h-3.5 w-16" />;
  }
  if (!latest) {
    return (
      <span className="text-muted-foreground">
        {GEO_PROMPT_RECEIPT_LABELS.noCompetitors}
      </span>
    );
  }
  return <span title={latest.scanId}>{truncateScanId(latest.scanId)}</span>;
}

function ReceiptMeta({
  prompt,
  result,
  latest,
  isLoading,
}: {
  prompt: string;
  result: GeoPromptResult;
  latest: GeoPromptHistoryCheck | null;
  isLoading: boolean;
}) {
  const receipt = buildPromptReceiptText({ prompt, result, latest });
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-4 text-xs">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <MetaItem label="Engine">{formatEngineFamily(result.engine)}</MetaItem>
        <MetaItem label={GEO_PROMPT_RECEIPT_LABELS.language}>
          {isLoading ? (
            <Skeleton className="h-3.5 w-12" />
          ) : (
            promptCheckLanguage(latest)
          )}
        </MetaItem>
        <MetaItem label={GEO_PROMPT_RECEIPT_LABELS.captured}>
          <time dateTime={result.lastCheckedAt}>
            {formatAiTrafficTimestamp(result.lastCheckedAt)}
          </time>
        </MetaItem>
        <MetaItem
          className="font-mono"
          label={GEO_PROMPT_RECEIPT_LABELS.scanId}
        >
          <ScanIdValue isLoading={isLoading} latest={latest} />
        </MetaItem>
      </div>
      <Button
        aria-label={GEO_PROMPT_RECEIPT_COPY_LABEL}
        className="h-7 gap-1.5 px-2"
        onClick={() =>
          copyTextToClipboard(receipt, GEO_PROMPT_RECEIPT_COPIED_MESSAGE)
        }
        size="sm"
        type="button"
        variant="outline"
      >
        <HugeiconsIcon aria-hidden="true" icon={Copy01Icon} size={14} />
        {GEO_PROMPT_RECEIPT_COPY_LABEL}
      </Button>
    </div>
  );
}

export function PromptReceiptAnalysis({
  prompt,
  result,
  history,
  isHistoryLoading,
}: PromptReceiptAnalysisProps) {
  const entries = promptHistoryChanges(history);
  const latest = entries[0]?.check ?? null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-6">
        <OutcomeStrip result={result} />
        <ReceiptSection title={GEO_PROMPT_RECEIPT_LABELS.searches}>
          <SearchQueries queries={result.searchQueries} />
        </ReceiptSection>
        <ReceiptSection title={GEO_PROMPT_RECEIPT_LABELS.sources}>
          <SourcesTable sources={result.sources} />
        </ReceiptSection>
        <ReceiptSection title={GEO_PROMPT_RECEIPT_LABELS.history}>
          <PromptReceiptHistory
            entries={entries}
            isLoading={isHistoryLoading}
          />
        </ReceiptSection>
        <ReceiptMeta
          isLoading={isHistoryLoading}
          latest={latest}
          prompt={prompt}
          result={result}
        />
      </div>
    </div>
  );
}
