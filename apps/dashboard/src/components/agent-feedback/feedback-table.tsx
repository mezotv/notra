"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { cn } from "@notra/ui/lib/utils";
import {
  AgentFeedbackKindBadge,
  AgentFeedbackStatusBadge,
} from "@/components/agent-feedback/feedback-badges";
import {
  AGENT_FEEDBACK_SENTIMENT_LABELS,
  AGENT_FEEDBACK_SKELETON_ROWS,
  AGENT_FEEDBACK_TABLE_COLUMN_COUNT,
  AGENT_FEEDBACK_UNSPECIFIED_LABEL,
} from "@/constants/agent-feedback";
import type { AgentFeedbackTableProps } from "@/types/agent-feedback";
import { formatRelative } from "@/utils/format-relative";

function SkeletonRows() {
  return AGENT_FEEDBACK_SKELETON_ROWS.map((row) => (
    <TableRow key={row}>
      <TableCell>
        <Skeleton className="h-4 w-64" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-14 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
    </TableRow>
  ));
}

export function AgentFeedbackTable({
  items,
  isPending,
  selectedId,
  onSelect,
}: AgentFeedbackTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[45%]">Feedback</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>Sentiment</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending ? <SkeletonRows /> : null}
          {!isPending && items.length === 0 ? (
            <TableRow>
              <TableCell
                className="h-24 text-center text-muted-foreground"
                colSpan={AGENT_FEEDBACK_TABLE_COLUMN_COUNT}
              >
                No feedback matches this filter
              </TableCell>
            </TableRow>
          ) : null}
          {!isPending &&
            items.map((item) => (
              <TableRow
                aria-selected={item.id === selectedId}
                className={cn(
                  "cursor-pointer",
                  item.id === selectedId && "bg-muted/60"
                )}
                key={item.id}
                onClick={() => onSelect(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(item);
                  }
                }}
                tabIndex={0}
              >
                <TableCell className="max-w-0">
                  <div className="truncate font-medium">
                    {item.title ?? item.message}
                  </div>
                  {item.title ? (
                    <div className="truncate text-muted-foreground text-xs">
                      {item.message}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <AgentFeedbackKindBadge kind={item.kind} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {item.sentiment
                    ? AGENT_FEEDBACK_SENTIMENT_LABELS[item.sentiment]
                    : "–"}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {item.agentClient ? (
                    <span className="font-mono">{item.agentClient}</span>
                  ) : (
                    <span className="italic">
                      {AGENT_FEEDBACK_UNSPECIFIED_LABEL}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <AgentFeedbackStatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {formatRelative(item.createdAt)}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
