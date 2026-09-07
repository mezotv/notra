"use client";

import { Button } from "@notra/ui/components/ui/button";
import { useState } from "react";

import { useGeoSentimentEvidence } from "@/lib/hooks/use-geo-sentiment";
import type {
  SentimentEvidenceListProps,
  SentimentEvidenceProps,
} from "@/types/geo-sentiment";
import { formatEngineFamily } from "@/utils/geo-charts";

function SentimentEvidenceList({
  organizationId,
  enabled,
}: SentimentEvidenceListProps) {
  const query = useGeoSentimentEvidence(organizationId, enabled);
  if (!enabled) {
    return null;
  }
  if (query.isPending) {
    return <p role="status">Loading negative answers…</p>;
  }
  if (query.isError) {
    return (
      <div role="alert">
        <p>Could not load negative answers.</p>
        <Button onClick={() => query.refetch()} variant="outline">
          Try again
        </Button>
      </div>
    );
  }
  const items = query.data.pages.flatMap((page) => page.items);
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No negative mentions in this period.
        </p>
      ) : null}
      {items.map((item) => (
        <details className="rounded-lg border p-3 text-sm" key={item.id}>
          <summary className="cursor-pointer space-y-1 break-words">
            <span className="block font-medium">{item.prompt}</span>
            <span className="text-muted-foreground block text-xs">
              Negative · {formatEngineFamily(item.engine)} ({item.engine}) ·{" "}
              {item.language} ·{" "}
              {item.capturedAt.replace("T", " ").replace("Z", " UTC")}
            </span>
          </summary>
          {item.excerpt ? (
            <blockquote className="my-3 border-l-2 pl-3">
              {item.excerpt}
            </blockquote>
          ) : null}
          <p className="mt-3 break-words whitespace-pre-wrap">{item.answer}</p>
        </details>
      ))}
      {query.hasNextPage ? (
        <Button
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
          variant="outline"
        >
          {query.isFetchingNextPage ? "Loading…" : "Load more answers"}
        </Button>
      ) : null}
    </div>
  );
}

export function SentimentEvidence({
  organizationId,
  negativeCount,
}: SentimentEvidenceProps) {
  const [open, setOpen] = useState(false);
  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer py-2 text-sm font-medium">
        Negative answers ({negativeCount})
      </summary>
      <SentimentEvidenceList enabled={open} organizationId={organizationId} />
    </details>
  );
}
