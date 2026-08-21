"use client";

import { GeoRangePicker } from "@/components/geo/geo-range-picker";
import { useGeoRangeDemo } from "@/lib/hooks/use-geo-range-demo";

export function GeoRangePickerDemo() {
  const control = useGeoRangeDemo();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="font-medium text-sm">Time range</div>
        <GeoRangePicker control={control} />
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground text-xs">From</div>
          <div className="tabular-nums">{control.query.from}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground text-xs">To</div>
          <div className="tabular-nums">{control.query.to}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground text-xs">URL param</div>
          <div className="truncate tabular-nums">
            {control.param ?? "none (default)"}
          </div>
        </div>
      </div>
    </div>
  );
}
