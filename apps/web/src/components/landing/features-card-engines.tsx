import { EngineIcon } from "@notra/ui/components/geo/engine-icon";
import { GeoBar } from "@notra/ui/components/geo/geo-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";

import { MockFrame } from "@/components/landing/mock-frame";
import {
  FEATURES_ENGINE_HEADERS,
  FEATURES_ENGINE_ROWS,
  FEATURES_ENGINES_FRAME,
} from "@/constants/landing/features";
import { GEO_ENGINE_NAMES } from "@/constants/landing/geo-engines";

const HEADER_CLASS = "text-muted-foreground text-xs";
const RATE_MAX = 100;

export function FeaturesCardEngines() {
  return (
    <MockFrame
      className="w-full min-w-[27rem]"
      heading={FEATURES_ENGINES_FRAME.heading}
      subhead={FEATURES_ENGINES_FRAME.subhead}
    >
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow>
            <TableHead className={HEADER_CLASS}>
              {FEATURES_ENGINE_HEADERS.engine}
            </TableHead>
            <TableHead className={HEADER_CLASS}>
              {FEATURES_ENGINE_HEADERS.mentionRate}
            </TableHead>
            <TableHead className={HEADER_CLASS}>
              {FEATURES_ENGINE_HEADERS.avgPosition}
            </TableHead>
            <TableHead className={HEADER_CLASS}>
              {FEATURES_ENGINE_HEADERS.lastChecked}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURES_ENGINE_ROWS.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="py-3">
                <span className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                  <EngineIcon engine={row.id} />
                  {GEO_ENGINE_NAMES[row.id]}
                </span>
              </TableCell>
              <TableCell className="py-3">
                <span className="flex items-center gap-2.5">
                  <GeoBar
                    className="w-16"
                    max={RATE_MAX}
                    value={row.mentionRate}
                  />
                  <span className="text-sm tabular-nums">
                    {row.mentionRate}%
                  </span>
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground py-3 text-sm tabular-nums">
                #{row.avgPosition}
              </TableCell>
              <TableCell className="text-muted-foreground py-3 text-sm whitespace-nowrap">
                {row.lastChecked}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </MockFrame>
  );
}
