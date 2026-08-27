import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";

import { HeroCollageGlyph } from "@/components/landing/hero-collage-glyph";
import {
  HERO_COLLAGE_CONTENT,
  HERO_COLLAGE_CONTENT_ROWS,
} from "@/constants/landing/hero-collage";

const HEADER_CLASS = "text-muted-foreground text-xs uppercase tracking-wider";

export function HeroCollageContentPanel() {
  return (
    <div className="bg-background relative z-10 h-[51.4375rem] w-[28.125rem] shrink-0 -translate-x-28 overflow-hidden rounded-3xl border border-black/5 py-5 pr-12 pl-8 transition-transform duration-300 ease-out lg:[transform:perspective(87.5rem)_rotateY(-8deg)] lg:motion-safe:hover:[transform:perspective(87.5rem)_rotateY(-3deg)_scale(1.03)] dark:border-white/10">
      <div className="mb-6 space-y-1">
        <h3 className="text-foreground font-sans text-[1.375rem] leading-[1.2] font-bold tracking-[-0.0375rem]">
          {HERO_COLLAGE_CONTENT.heading}
        </h3>
        <p className="text-muted-foreground text-sm leading-[1.5]">
          {HERO_COLLAGE_CONTENT.subhead}
        </p>
      </div>

      <div className="lg:border-border/80 lg:border-b-border/40 lg:bg-muted/80 overflow-hidden rounded-lg border border-transparent bg-transparent shadow-none lg:shadow-2xs">
        <Table>
          <TableHeader className="lg:bg-muted/80 bg-transparent">
            <TableRow>
              <TableHead className={`${HEADER_CLASS} w-[14.5rem]`}>
                {HERO_COLLAGE_CONTENT.nameHeader}
              </TableHead>
              <TableHead className={`${HEADER_CLASS} w-14`}>
                {HERO_COLLAGE_CONTENT.typesHeader}
              </TableHead>
              <TableHead className={`${HEADER_CLASS} w-36`}>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {HERO_COLLAGE_CONTENT_ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="w-[14.5rem] max-w-[14.5rem] py-3">
                  <span className="block truncate text-sm font-medium">
                    {row.name}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-center">
                    <HeroCollageGlyph type={row.type} />
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  2 days ago
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
