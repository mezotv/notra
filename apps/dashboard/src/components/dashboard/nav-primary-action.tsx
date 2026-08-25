"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Button, buttonVariants } from "@notra/ui/components/ui/button";
import { SidebarGroup } from "@notra/ui/components/ui/sidebar";
import { cn } from "@notra/ui/lib/utils";
import Link from "next/link";
import type { NavPrimaryActionProps } from "@/types/components/nav";

const ACTION_CLASS =
  "w-full cursor-pointer justify-start group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0";

export function NavPrimaryAction({
  label,
  icon,
  href,
  onClick,
}: NavPrimaryActionProps) {
  const content = (
    <>
      <HugeiconsIcon icon={icon} />
      <span className="group-data-[collapsible=icon]:hidden">{label}</span>
    </>
  );

  return (
    <SidebarGroup className="py-1">
      {href ? (
        <Link
          className={cn(buttonVariants(), ACTION_CLASS)}
          href={href}
          prefetch
          title={label}
        >
          {content}
        </Link>
      ) : (
        <Button className={ACTION_CLASS} onClick={onClick} title={label}>
          {content}
        </Button>
      )}
    </SidebarGroup>
  );
}
