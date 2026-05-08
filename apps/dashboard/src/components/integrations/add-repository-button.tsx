"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import type { AddRepositoryButtonProps } from "@/types/integrations";

export function AddRepositoryButton({
  onAdd,
  label = "Add",
}: AddRepositoryButtonProps) {
  return (
    <Button
      className="h-6 shrink-0 gap-1 rounded px-2 text-xs"
      onClick={() => onAdd?.()}
      size="sm"
      type="button"
    >
      <HugeiconsIcon className="size-3" icon={Add01Icon} />
      {label}
    </Button>
  );
}
