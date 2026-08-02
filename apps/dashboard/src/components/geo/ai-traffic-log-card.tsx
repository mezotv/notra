"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { PurposeBadge } from "@/components/geo/purpose-badge";
import { InstrumentModule } from "@/components/instrument/instrument-module";
import type { AiTrafficLogCardProps, AiTrafficLogEntry } from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";

function LogRow({ entry }: { entry: AiTrafficLogEntry }) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
        {formatAiTrafficTimestamp(entry.capturedAt)}
      </TableCell>
      <TableCell className="font-medium text-sm">{entry.agent}</TableCell>
      <TableCell
        className="max-w-[28rem] truncate font-mono text-xs"
        title={entry.path}
      >
        {entry.path}
      </TableCell>
      <TableCell>
        <PurposeBadge category={entry.category} />
      </TableCell>
      <TableCell className="font-mono text-[0.6875rem] text-muted-foreground">
        {entry.method}
      </TableCell>
    </TableRow>
  );
}

export function AiTrafficLogCard({ log }: AiTrafficLogCardProps) {
  return (
    <InstrumentModule
      eyebrow="Recent AI requests"
      readout={`last ${log.length} hits`}
    >
      <div className="overflow-x-auto rounded-sm border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:first-child>td:first-child]:rounded-tl-none [&_tr:first-child>td:last-child]:rounded-tr-none">
            {log.map((entry) => (
              <LogRow
                entry={entry}
                key={`${entry.capturedAt}-${entry.agent}-${entry.path}`}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </InstrumentModule>
  );
}
