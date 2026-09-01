"use client";

import { EngineIcon } from "@notra/ui/components/geo/engine-icon";
import { GapMeter } from "@notra/ui/components/geo/gap-meter";
import { LogoStack } from "@notra/ui/components/geo/logo-stack";
import { Button } from "@notra/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { GEO_GAPS_METER_STEPS } from "@notra/ui/constants/geo";

import { MockFrame } from "@/components/landing/mock-frame";
import {
  FEATURES_GAP_HEADERS,
  FEATURES_GAP_ROWS,
  FEATURES_GAPS_FRAME,
} from "@/constants/landing/features";
import { GEO_ENGINE_NAMES } from "@/constants/landing/geo-engines";

const HEADER_CLASS = "text-muted-foreground text-xs";

export function FeaturesCardGaps() {
  return (
    <MockFrame
      className="w-full min-w-[27rem]"
      heading={FEATURES_GAPS_FRAME.heading}
      subhead={FEATURES_GAPS_FRAME.subhead}
    >
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow>
            <TableHead className={HEADER_CLASS}>
              {FEATURES_GAP_HEADERS.content}
            </TableHead>
            <TableHead className={HEADER_CLASS}>
              {FEATURES_GAP_HEADERS.opportunity}
            </TableHead>
            <TableHead className={HEADER_CLASS}>
              {FEATURES_GAP_HEADERS.missing}
            </TableHead>
            <TableHead className={HEADER_CLASS} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURES_GAP_ROWS.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="max-w-[9rem] py-3">
                <span className="block truncate text-sm font-medium">
                  {row.content}
                </span>
              </TableCell>
              <TableCell className="py-3">
                <GapMeter
                  label={`${row.mentionRate}% mention rate, ${row.opportunity}/${GEO_GAPS_METER_STEPS} opportunity`}
                  level={row.opportunity}
                />
              </TableCell>
              <TableCell className="py-3">
                <LogoStack
                  items={row.missing.map((engine) => ({
                    key: engine,
                    label: GEO_ENGINE_NAMES[engine],
                    renderIcon: (className) => (
                      <EngineIcon className={className} engine={engine} />
                    ),
                  }))}
                />
              </TableCell>
              <TableCell className="py-3">
                <Button size="sm" variant="outline">
                  {FEATURES_GAP_HEADERS.action}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </MockFrame>
  );
}
