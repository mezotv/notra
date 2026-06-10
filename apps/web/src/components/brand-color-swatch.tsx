"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { copyToClipboard } from "@/utils/copy-to-clipboard";
import type { BrandColorSwatchProps } from "~types/brand";

export function BrandColorSwatch({ color }: BrandColorSwatchProps) {
  return (
    <button
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border/70 bg-background text-left transition-transform duration-150 ease-out active:scale-[0.98]"
      onClick={() => copyToClipboard(color.hex, `Copied ${color.hex}`)}
      type="button"
    >
      <span
        className="relative flex h-24 w-full items-center justify-center border-border/70 border-b"
        style={{ backgroundColor: color.hex }}
      >
        <span className="flex items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 font-medium text-foreground text-xs opacity-0 shadow-sm ring-1 ring-black/5 transition-opacity duration-150 ease-out group-hover:opacity-100 dark:ring-white/10">
          <HugeiconsIcon className="size-3.5" icon={Copy01Icon} />
          Click to copy
        </span>
      </span>
      <span className="flex flex-col gap-1 p-4">
        <span className="font-medium text-foreground text-sm">
          {color.name}
        </span>
        <span className="font-mono text-muted-foreground text-xs uppercase">
          {color.hex}
        </span>
        <span className="text-muted-foreground text-xs leading-5">
          {color.usage}
        </span>
      </span>
    </button>
  );
}
