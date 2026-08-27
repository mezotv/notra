import { Blockchain04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Github } from "@notra/ui/components/ui/svgs/github";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";

import {
  HERO_COLLAGE_EVENT_ROWS,
  HERO_COLLAGE_EVENTS,
} from "@/constants/landing/hero-collage";

export function HeroCollageEventsPanel() {
  return (
    <div className="bg-background relative z-10 h-[52rem] w-[28.125rem] shrink-0 translate-x-28 overflow-hidden rounded-3xl border border-black/5 py-5 pr-8 pl-12 transition-transform duration-300 ease-out lg:[transform:perspective(87.5rem)_rotateY(8deg)] lg:motion-safe:hover:[transform:perspective(87.5rem)_rotateY(3deg)_scale(1.03)] dark:border-white/10">
      <div className="mb-6 space-y-1">
        <h3 className="text-foreground font-sans text-[1.375rem] leading-[1.2] font-bold tracking-[-0.0375rem]">
          {HERO_COLLAGE_EVENTS.heading}
        </h3>
        <p className="text-muted-foreground text-sm leading-[1.5]">
          {HERO_COLLAGE_EVENTS.subhead}
        </p>
      </div>

      <div className="border-border/60 flex items-center gap-3 border-b">
        <span className="text-foreground after:bg-foreground relative pb-2 text-sm font-medium after:absolute after:inset-x-0 after:-bottom-px after:h-0.5">
          {HERO_COLLAGE_EVENTS.activeTab}
        </span>
        <span className="text-muted-foreground pb-2 text-sm font-medium">
          {HERO_COLLAGE_EVENTS.pausedTab}
        </span>
      </div>

      <div className="lg:border-border/80 lg:border-b-border/40 lg:bg-muted/80 mt-4 overflow-hidden rounded-lg border border-transparent bg-transparent shadow-none lg:shadow-2xs">
        <Table>
          <TableHeader className="lg:bg-muted/80 bg-transparent">
            <TableRow>
              <TableHead>{HERO_COLLAGE_EVENTS.typeHeader}</TableHead>
              <TableHead>{HERO_COLLAGE_EVENTS.eventsHeader}</TableHead>
              <TableHead>{HERO_COLLAGE_EVENTS.outputHeader}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {HERO_COLLAGE_EVENT_ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="bg-muted/50 flex size-8 items-center justify-center rounded-lg border">
                      <Github className="size-4" />
                    </span>
                    <span className="text-sm whitespace-nowrap">
                      {row.type}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {row.event}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                    <HugeiconsIcon
                      className="size-3.5 text-violet-500 dark:text-violet-300"
                      icon={Blockchain04Icon}
                    />
                    {row.output}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
