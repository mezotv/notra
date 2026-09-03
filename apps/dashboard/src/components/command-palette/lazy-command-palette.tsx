"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@notra/ui/components/ui/dialog";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useCommandPalette } from "@/components/command-palette/command-palette-context";

const loadCommandPalette = () =>
  import("@/components/command-palette/command-palette").then(
    (module) => module.CommandPalette
  );

const CommandPalette = dynamic(loadCommandPalette, {
  loading: () => null,
  ssr: false,
});

export function preloadCommandPalette(): void {
  void loadCommandPalette().catch(() => undefined);
}

export function LazyCommandPalette() {
  const { hasOpened, open, setOpen } = useCommandPalette();
  const [isPaletteReady, setIsPaletteReady] = useState(false);

  useEffect(() => {
    if (!(hasOpened && !isPaletteReady)) {
      return;
    }

    let active = true;
    void loadCommandPalette()
      .then(() => {
        if (active) {
          setIsPaletteReady(true);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [hasOpened, isPaletteReady]);

  if (open && !isPaletteReady) {
    return (
      <Dialog onOpenChange={(nextOpen) => setOpen(nextOpen)} open>
        <DialogContent className="overflow-hidden rounded-xl p-3 sm:max-w-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Command Palette</DialogTitle>
            <DialogDescription>Loading available commands.</DialogDescription>
          </DialogHeader>
          <div aria-live="polite" className="space-y-3" role="status">
            <Skeleton aria-hidden className="h-8 w-full" />
            <Skeleton aria-hidden className="h-48 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return hasOpened && isPaletteReady ? <CommandPalette /> : null;
}
