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
    <div className="relative z-10 h-[52rem] w-[28.125rem] shrink-0 overflow-hidden rounded-3xl border border-black/5 bg-background py-5 pr-8 pl-12 transition-transform duration-300 ease-out dark:border-white/10 lg:[transform:perspective(87.5rem)_rotateY(8deg)] lg:motion-safe:hover:[transform:perspective(87.5rem)_rotateY(3deg)_scale(1.03)]">
      <div className="mb-6 space-y-1">
        <h3 className="font-bold font-sans text-[1.375rem] text-foreground leading-[1.2] tracking-[-0.0375rem]">
          {HERO_COLLAGE_EVENTS.heading}
        </h3>
        <p className="text-muted-foreground text-sm leading-[1.5]">
          {HERO_COLLAGE_EVENTS.subhead}
        </p>
      </div>

      <div className="flex items-center gap-3 border-border/60 border-b">
        <span className="after:-bottom-px relative pb-2 font-medium text-foreground text-sm after:absolute after:inset-x-0 after:h-0.5 after:bg-foreground">
          {HERO_COLLAGE_EVENTS.activeTab}
        </span>
        <span className="pb-2 font-medium text-muted-foreground text-sm">
          {HERO_COLLAGE_EVENTS.pausedTab}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-muted/80 shadow-2xs">
        <Table>
          <TableHeader>
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
                    <span className="flex size-8 items-center justify-center rounded-lg border bg-muted/50">
                      <Github className="size-4" />
                    </span>
                    <span className="whitespace-nowrap text-sm">
                      {row.type}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {row.event}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="flex items-center gap-1.5 whitespace-nowrap text-sm">
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
