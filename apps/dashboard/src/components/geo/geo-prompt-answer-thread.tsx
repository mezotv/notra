"use client";

import { Copy01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { GEO_SENTIMENT_LABELS } from "@notra/geo-core/constants/geo";
import type { GeoChatSkin, GeoPromptResult } from "@notra/geo-core/types/geo";
import { formatAiTrafficTimestamp } from "@notra/geo-core/utils/ai-traffic";
import { perplexitySourcesFromExcerpt } from "@notra/geo-core/utils/geo-perplexity-sources";
import { getReferenceDomain } from "@notra/geo-core/utils/reference-display";
import { MessageResponse } from "@notra/ui/components/ai-elements/message";
import { Badge } from "@notra/ui/components/ui/badge";
import type { PerplexitySearchSource } from "@notra/ui/types/perplexity";
import type { ReactNode } from "react";

import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import type { GeoPromptAnswerThreadProps } from "@/types/geo";
import { copyToClipboard } from "@/utils/copy-to-clipboard";
import { getSafeReferenceSourceUrl } from "@/utils/reference-source-url";

const ANSWER_MARKDOWN_CLASS =
  "[&_h1]:mt-0 [&_h1]:mb-2 [&_h1]:text-[1.15em] [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-[1.05em] [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-[1em] [&_h3]:font-semibold [&_p]:my-2.5 [&_ul]:my-2.5 [&_ol]:my-2.5";

function emptyAnswerCopy(mentioned: boolean): string {
  return mentioned
    ? "Mentioned, but no answer was captured."
    : "This engine did not mention you.";
}

function displayAnswer(result: { answer: string; excerpt: string }): string {
  return result.answer.trim() || result.excerpt.trim();
}

function threadSources(
  result: GeoPromptResult,
  answer: string
): PerplexitySearchSource[] {
  if (result.sources.length > 0) {
    return result.sources.map((source) => ({
      title: source.title ?? source.domain ?? source.url,
      domain: source.domain ?? "",
      url: source.url,
      verified: true,
    }));
  }

  return perplexitySourcesFromExcerpt(answer);
}

export function AnswerMarkdown({
  text,
  skin,
}: {
  text: string;
  skin: GeoChatSkin;
}) {
  return (
    <MessageResponse
      className={cn(
        ANSWER_MARKDOWN_CLASS,
        skin === "claude" &&
          "[&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif",
        skin === "perplexity" &&
          "font-serif [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif"
      )}
    >
      {text}
    </MessageResponse>
  );
}

function AssistantBody({
  answer,
  mentioned,
  skin,
}: {
  answer: string;
  mentioned: boolean;
  skin: GeoChatSkin;
}) {
  if (answer.length > 0) {
    return <AnswerMarkdown skin={skin} text={answer} />;
  }

  return (
    <p className="text-muted-foreground text-sm leading-6">
      {emptyAnswerCopy(mentioned)}
    </p>
  );
}

function ReceiptSummary({
  result,
  sources,
}: {
  result: GeoPromptResult;
  sources: PerplexitySearchSource[];
}) {
  const sentiment = result.sentiment
    ? (GEO_SENTIMENT_LABELS[result.sentiment] ?? result.sentiment)
    : "Not scored";

  return (
    <>
      <ReceiptMetric label="Result">
        <Badge
          className={cn(
            "rounded-md",
            result.mentioned
              ? "bg-geo-up/10 text-geo-up"
              : "text-muted-foreground"
          )}
          variant="outline"
        >
          {result.mentioned ? "Mentioned" : "Not mentioned"}
        </Badge>
      </ReceiptMetric>
      <ReceiptMetric
        label="Position"
        value={result.position === null ? "—" : `#${result.position}`}
      />
      <ReceiptMetric label="Sentiment" value={sentiment} />
      <ReceiptMetric label="Searches" value={result.searchQueries.length} />
      <ReceiptMetric label="Sources" value={sources.length} />
    </>
  );
}

function ReceiptMetric({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | number;
  children?: ReactNode;
}) {
  return (
    <div className="bg-background flex min-h-16 flex-col justify-center gap-1 px-3 py-2.5">
      <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm font-medium tabular-nums">{children ?? value}</dd>
    </div>
  );
}

function SearchEvidence({
  queries,
  sources,
}: {
  queries: readonly string[];
  sources: readonly PerplexitySearchSource[];
}) {
  if (queries.length === 0 && sources.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="prompt-receipt-evidence" className="space-y-4">
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          aria-hidden="true"
          className="text-muted-foreground size-4"
          icon={Search01Icon}
          strokeWidth={2}
        />
        <h2 id="prompt-receipt-evidence" className="text-sm font-semibold">
          Search evidence
        </h2>
      </div>
      {queries.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-muted-foreground text-xs font-medium">Queries</h3>
          <ul className="flex flex-wrap gap-2">
            {queries.map((query) => (
              <li
                className="bg-muted rounded-md px-2.5 py-1.5 text-xs"
                key={query}
              >
                {query}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {sources.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-muted-foreground text-xs font-medium">
            Cited sources
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {sources.map((source) => {
              const href = source.url
                ? getSafeReferenceSourceUrl(source.url)
                : null;
              const domain = getReferenceDomain(source.url) ?? source.domain;
              const content = (
                <>
                  <span className="line-clamp-1 text-sm font-medium">
                    {source.title}
                  </span>
                  <span className="text-muted-foreground line-clamp-1 text-xs">
                    {domain}
                  </span>
                </>
              );

              return (
                <li key={`${source.url}-${source.title}`}>
                  {href ? (
                    <a
                      className="border-border/70 hover:bg-muted/50 focus-visible:ring-ring flex min-w-0 flex-col rounded-lg border px-3 py-2 transition-colors outline-none focus-visible:ring-2"
                      href={href}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="border-border/70 flex min-w-0 flex-col rounded-lg border px-3 py-2">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function GeoPromptAnswerThread({
  prompt,
  result,
}: GeoPromptAnswerThreadProps) {
  const answer = displayAnswer(result);
  const sources = threadSources(result, answer);
  const timestamp = formatAiTrafficTimestamp(result.lastCheckedAt);

  return (
    <div className="bg-background relative h-full min-h-0 overflow-y-auto overscroll-contain">
      <article className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            Result captured {timestamp}
          </p>
          <p className="text-muted-foreground text-xs">
            Stored scan · read-only
          </p>
        </div>
        <dl className="border-border/70 bg-muted/20 grid gap-px overflow-hidden rounded-xl border sm:grid-cols-5">
          <ReceiptSummary result={result} sources={sources} />
        </dl>
        <section aria-labelledby="prompt-receipt-prompt" className="space-y-2">
          <h2
            className="text-muted-foreground text-xs font-medium"
            id="prompt-receipt-prompt"
          >
            Prompt
          </h2>
          <p className="bg-muted/40 rounded-xl px-4 py-3 text-sm leading-6">
            {prompt}
          </p>
        </section>
        <SearchEvidence queries={result.searchQueries} sources={sources} />
        <section aria-labelledby="prompt-receipt-answer" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold" id="prompt-receipt-answer">
              Model answer
            </h2>
            {answer.length > 0 ? (
              <Button
                aria-label="Copy model answer"
                className="text-muted-foreground"
                onClick={() => copyToClipboard(answer)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <HugeiconsIcon aria-hidden="true" icon={Copy01Icon} size={14} />
                Copy
              </Button>
            ) : null}
          </div>
          <div className="border-border/70 rounded-xl border px-4 py-4 sm:px-5">
            <AssistantBody
              answer={answer}
              mentioned={result.mentioned}
              skin="chatgpt"
            />
          </div>
        </section>
      </article>
    </div>
  );
}
