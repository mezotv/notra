"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import type { ComponentProps } from "react";
import { Button } from "@/components/button";

type CreateContentButtonProps = Omit<ComponentProps<typeof Button>, "children">;

export function CreateContentButton(props: CreateContentButtonProps) {
  return (
    <Button className="gap-1.5" {...props}>
      <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
      Create Content
      <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
    </Button>
  );
}
