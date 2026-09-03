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
import { loadCommandPalette } from "@/components/command-palette/command-palette-loader";

const CommandPalette = dynamic(loadCommandPalette, {
  loading: () => null,
  ssr: false,
});

export function LazyCommandPalette() {
  const { hasOpened, open, setOpen } = useCommandPalette();
  const [isPaletteReady, setIsPaletteReady] = useState(false);

  useEffect(() => {
    if (!(hasOpened && !isPaletteReady)) {
      return;
    }

    let active = true;
    async function prepareCommandPalette() {
      try {
        await loadCommandPalette();
        if (active) {
          setIsPaletteReady(true);
        }
      } catch {
        // Keep the loading state so a future open can retry.
      }
    }
    void prepareCommandPalette();
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

  return hasOpened && isPaletteReady ? (
    <CommandPalette key={open ? "open" : "closed"} />
  ) : null;
}
