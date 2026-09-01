import { GeoBar } from "@notra/ui/components/geo/geo-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { cn } from "@notra/ui/lib/utils";
import Image from "next/image";

import type { ShareRow, ShareRowLogo } from "@/types/landing/geo";

const HEADER_CLASS = "text-muted-foreground text-xs";
const SHARE_MAX = 100;
const LOGO_SIZE_PX = 40;
const LOGO_CLASS = "size-5 shrink-0 rounded-sm object-contain";

function BrandLogo({ brand, logo }: { brand: string; logo: ShareRowLogo }) {
  const alt = `${brand} logo`;
  if (logo.darkSrc) {
    return (
      <>
        <Image
          alt={alt}
          className={cn(LOGO_CLASS, "dark:hidden")}
          height={LOGO_SIZE_PX}
          src={logo.src}
          width={LOGO_SIZE_PX}
        />
        <Image
          alt={alt}
          className={cn(LOGO_CLASS, "hidden dark:block")}
          height={LOGO_SIZE_PX}
          src={logo.darkSrc}
          width={LOGO_SIZE_PX}
        />
      </>
    );
  }
  return (
    <Image
      alt={alt}
      className={cn(LOGO_CLASS, logo.invertOnDark && "dark:invert")}
      height={LOGO_SIZE_PX}
      src={logo.src}
      width={LOGO_SIZE_PX}
    />
  );
}

export function ShareOfVoiceRows({
  rows,
  headers,
}: {
  rows: ShareRow[];
  headers: { brand: string; share: string; mentions: string };
}) {
  return (
    <Table>
      <TableHeader className="bg-muted/60">
        <TableRow>
          <TableHead className={HEADER_CLASS}>{headers.brand}</TableHead>
          <TableHead className={HEADER_CLASS}>{headers.share}</TableHead>
          <TableHead className={HEADER_CLASS}>{headers.mentions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="py-2.5">
              <span className="flex items-center gap-2 text-sm">
                <BrandLogo brand={row.brand} logo={row.logo} />
                <span className={cn("truncate", row.isYou && "font-medium")}>
                  {row.brand}
                </span>
              </span>
            </TableCell>
            <TableCell className="py-2.5">
              <span className="flex items-center gap-2">
                <GeoBar
                  className="h-2 w-16"
                  fillColor={row.color}
                  max={SHARE_MAX}
                  value={row.share}
                />
                <span className="text-sm tabular-nums">{row.share}%</span>
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground py-2.5 text-sm tabular-nums">
              {row.mentions}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
