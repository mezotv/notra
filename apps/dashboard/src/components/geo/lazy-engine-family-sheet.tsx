"use client";

import { engineFamilyLabel } from "@notra/geo-core/utils/geo-engine-family";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@notra/ui/components/ui/sheet";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import type { EngineFamilySheetProps } from "@/types/geo";

const loadEngineFamilySheet = () =>
  import("@/components/geo/engine-family-sheet").then(
    (module) => module.EngineFamilySheet
  );

const EngineFamilySheet = dynamic(loadEngineFamilySheet, {
  loading: () => null,
  ssr: false,
});

export function LazyEngineFamilySheet(props: EngineFamilySheetProps) {
  const [isSheetReady, setIsSheetReady] = useState(false);
  const { family, onOpenChange, open } = props;

  useEffect(() => {
    if (!(open && !isSheetReady)) {
      return;
    }

    let active = true;
    void loadEngineFamilySheet()
      .then(() => {
        if (active) {
          setIsSheetReady(true);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isSheetReady, open]);

  if (!isSheetReady) {
    return (
      <Sheet onOpenChange={onOpenChange} open={open}>
        <SheetContent className="gap-0 overflow-hidden rounded-xl data-[side=right]:inset-y-2 data-[side=right]:right-2 data-[side=right]:h-auto data-[side=right]:border data-[side=right]:sm:max-w-2xl">
          <SheetHeader className="bg-muted/50 border-b pr-14">
            <SheetTitle>
              {family ? engineFamilyLabel(family.family) : "Engine details"}
            </SheetTitle>
            <SheetDescription>Loading engine details.</SheetDescription>
          </SheetHeader>
          <div aria-live="polite" className="space-y-4 p-4" role="status">
            <Skeleton aria-hidden className="h-20 w-full" />
            <Skeleton aria-hidden className="h-56 w-full" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return <EngineFamilySheet {...props} />;
}
