"use client";

import { findCompetitorDomain } from "@notra/geo-core/geo/domain";
import type { ShareOfVoiceRow } from "@notra/geo-core/types/geo";
import { GeoBar } from "@notra/ui/components/geo/geo-bar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@notra/ui/components/ui/sheet";

import { CompetitorLogo } from "@/components/geo/competitor-logo";
import {
  BrandTrackingBadge,
  TrackBrandButton,
} from "@/components/geo/share-of-voice-brand-tag";
import { cn } from "@/lib/utils";
import type { ShareOfVoiceOtherSheetProps } from "@/types/geo";
import { formatMentionRate } from "@/utils/geo-charts";
import {
  isOwnBrandName,
  shareOfVoiceSliceColor,
} from "@/utils/geo-competitors";

const OTHER_SHEET_CONTENT_CLASS =
  "gap-0 overflow-hidden rounded-xl data-[side=right]:inset-y-2 data-[side=right]:right-2 data-[side=right]:h-auto data-[side=right]:border sm:max-w-md";

function OtherBrandRow({
  row,
  index,
  competitors,
  maxShare,
  companyName,
  aliases,
  onClick,
  onPointerEnter,
  onTrack,
}: {
  row: ShareOfVoiceRow;
  index: number;
  competitors?: ShareOfVoiceOtherSheetProps["competitors"];
  maxShare: number;
  companyName?: string | null;
  aliases?: readonly string[];
  onClick?: () => void;
  onPointerEnter?: () => void;
  onTrack?: (brand: string) => void;
}) {
  const ownBrand = { companyName, aliases };
  const color = shareOfVoiceSliceColor(row.brand, index, competitors, ownBrand);
  const own = isOwnBrandName(row.brand, companyName, aliases);
  const trackAction =
    !own && !row.tracked && onTrack ? (
      <TrackBrandButton
        brand={row.brand}
        className="shrink-0"
        onTrack={onTrack}
      />
    ) : null;
  const content = (
    <>
      <CompetitorLogo
        className="size-5 shrink-0"
        domain={findCompetitorDomain(competitors, row.brand)}
        name={row.brand}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm">{row.brand}</span>
            {own ? null : <BrandTrackingBadge tracked={row.tracked} />}
          </span>
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {row.mentions.toLocaleString()}
          </span>
        </span>
        <span className="mt-1.5 flex items-center gap-2">
          <GeoBar
            className="h-1.5"
            fillColor={own ? undefined : color.light}
            max={maxShare}
            value={row.share}
          />
          <span className="w-8 shrink-0 text-right text-xs tabular-nums">
            {formatMentionRate(row.share)}
          </span>
        </span>
      </span>
    </>
  );

  const className = "flex w-full items-center gap-3 rounded-lg px-2 py-2";

  if (!onClick) {
    return (
      <div className="flex items-center gap-1">
        <div className={cn(className, "min-w-0 flex-1")}>{content}</div>
        {trackAction}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        className={cn(
          className,
          "hover:bg-muted/60 min-w-0 flex-1 text-left transition-colors"
        )}
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        type="button"
      >
        {content}
      </button>
      {trackAction}
    </div>
  );
}

export function ShareOfVoiceOtherSheet({
  open,
  onOpenChange,
  other,
  others,
  competitors,
  companyName,
  aliases,
  onBrandClick,
  onBrandPointerEnter,
  onTrackBrand,
}: ShareOfVoiceOtherSheetProps) {
  const maxShare = others.reduce((max, row) => Math.max(max, row.share), 0);

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className={OTHER_SHEET_CONTENT_CLASS}>
        <SheetHeader className="bg-muted/50 border-b pr-14">
          <SheetTitle>Other</SheetTitle>
          <SheetDescription className="tabular-nums">
            {others.length} brands · {formatMentionRate(other.share)} of
            mentions · {other.mentions.toLocaleString()}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {others.map((row, index) => (
              <li key={row.brand}>
                <OtherBrandRow
                  aliases={aliases}
                  companyName={companyName}
                  competitors={competitors}
                  index={index}
                  maxShare={maxShare}
                  onClick={
                    onBrandClick
                      ? () => {
                          onOpenChange(false);
                          onBrandClick(row);
                        }
                      : undefined
                  }
                  onPointerEnter={
                    onBrandPointerEnter
                      ? () => onBrandPointerEnter(row)
                      : undefined
                  }
                  onTrack={onTrackBrand}
                  row={row}
                />
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
