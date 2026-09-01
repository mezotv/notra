"use client";

import { ScrollArea } from "@notra/ui/components/ui/scroll-area";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { CitationRows } from "@/components/landing/citation-rows";
import {
  HERO_COLLAGE_CITATION_HEADERS,
  HERO_COLLAGE_CITATION_ROWS,
} from "@/constants/landing/hero-collage";
import { LIVE_TRAFFIC_MAX_ROWS } from "@/constants/landing/live-traffic";
import {
  randomLiveDelayMs,
  randomLiveRow,
  seedLiveRows,
} from "@/lib/landing/live-traffic";
import { pageClockElapsedMs, usePageClockBase } from "@/lib/landing/page-clock";

export function LiveTrafficLog() {
  const reduceMotion = useReducedMotion();
  const base = usePageClockBase();
  const [rows, setRows] = useState(() =>
    seedLiveRows(HERO_COLLAGE_CITATION_ROWS)
  );
  const live = !reduceMotion;

  useEffect(() => {
    if (!live) {
      return;
    }
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        const row = randomLiveRow(pageClockElapsedMs());
        setRows((previous) =>
          [row, ...previous].slice(0, LIVE_TRAFFIC_MAX_ROWS)
        );
        schedule();
      }, randomLiveDelayMs());
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [live]);

  return (
    <ScrollArea className="h-full [&_[data-slot=table-container]]:overflow-visible">
      <CitationRows
        animated={live}
        base={base}
        headers={HERO_COLLAGE_CITATION_HEADERS}
        rows={rows}
      />
    </ScrollArea>
  );
}
