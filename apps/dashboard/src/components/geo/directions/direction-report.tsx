"use client";

import { GEO_SEARCH_LABEL } from "@notra/geo-core/constants/geo";
import { formatGeoJourneyChip } from "@notra/geo-core/utils/ai-traffic";

import { DirectionDonut } from "@/components/geo/directions/direction-donut";
import { DirectionEngineBars } from "@/components/geo/directions/direction-engine-bars";
import { DirectionPagesTable } from "@/components/geo/directions/direction-pages-table";
import {
  GEO_DIRECTIONS_CHECK_COUNT,
  GEO_DIRECTIONS_COMPANY,
  GEO_DIRECTIONS_ENGINE_COUNT,
  GEO_DIRECTIONS_JOURNEYS,
  GEO_DIRECTIONS_VISIBILITY,
  GEO_DIRECTIONS_VISIBILITY_DELTA,
  GEO_DIRECTIONS_WEEK_LABEL,
} from "@/constants/geo-directions";
import { formatMentionRate } from "@/utils/geo-charts";

const LEAD_JOURNEY = GEO_DIRECTIONS_JOURNEYS[0];

export function DirectionReport() {
  return (
    <article className="mx-auto max-w-2xl space-y-10">
      <header className="space-y-4">
        <p className="text-muted-foreground text-xs capitalize">
          GEO · {GEO_DIRECTIONS_WEEK_LABEL} · {GEO_DIRECTIONS_CHECK_COUNT}{" "}
          checks across {GEO_DIRECTIONS_ENGINE_COUNT} engines
        </p>
        <h1 className="text-2xl leading-snug font-semibold tracking-tight">
          AI engines mention {GEO_DIRECTIONS_COMPANY} in{" "}
          {formatMentionRate(GEO_DIRECTIONS_VISIBILITY)} of answers,{" "}
          <span className="text-geo-up">
            up {GEO_DIRECTIONS_VISIBILITY_DELTA} points
          </span>{" "}
          this week.
        </h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          ChatGPT {GEO_SEARCH_LABEL} is where you win.
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {GEO_SEARCH_LABEL} names you in{" "}
          <span className="text-foreground font-semibold">71%</span> of answers,
          while ChatGPT without search gets you to{" "}
          <span className="text-foreground font-semibold">62%</span>.
        </p>
        <DirectionEngineBars />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Your changelog is the front door for AI traffic.
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          One page took{" "}
          <span className="text-foreground font-semibold">10,412</span> of your{" "}
          <span className="text-foreground font-semibold">18,226</span> AI
          visits this week.
        </p>
        <DirectionPagesTable />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          You own about a third of the conversation.
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Across competitor comparisons you take{" "}
          <span className="text-foreground font-semibold">31%</span> of
          mentions, ahead of Jasper at{" "}
          <span className="text-foreground font-semibold">24%</span>.
        </p>
        <DirectionDonut />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Agents are reading you deeply, not just fetching one page.
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          One GPTBot journey{" "}
          <span className="bg-muted text-muted-foreground rounded-sm px-1.5 py-0.5 font-mono text-xs">
            {formatGeoJourneyChip(LEAD_JOURNEY?.journeyId ?? "")}
          </span>{" "}
          read <span className="text-foreground font-semibold">14 pages</span>{" "}
          in <span className="text-foreground font-semibold">22 minutes</span>,
          starting at{" "}
          <span className="text-foreground font-mono text-xs">/changelog</span>.
        </p>
      </section>
    </article>
  );
}
