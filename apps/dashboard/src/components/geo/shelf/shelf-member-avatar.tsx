"use client";

import { UserCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";

import { cn } from "@/lib/utils";
import type { GeoShelfMemberAvatarProps } from "@/types/geo-shelf";
import { getUserAvatarUrl } from "@/utils/avatar";
import { shelfMemberInitial } from "@/utils/geo-shelf";

export function ShelfMemberAvatar({
  member,
  className,
  fallbackLabel = "Unassigned",
}: GeoShelfMemberAvatarProps) {
  if (!member) {
    return (
      <span
        className={cn(
          "text-muted-foreground inline-flex min-w-0 items-center gap-2",
          className
        )}
      >
        <span className="border-border inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed">
          <HugeiconsIcon className="size-3.5" icon={UserCircleIcon} />
        </span>
        <span className="truncate text-sm">{fallbackLabel}</span>
      </span>
    );
  }
  return (
    <span
      className={cn("inline-flex min-w-0 items-center gap-2", className)}
      title={member.email}
    >
      <Avatar className="size-6 shrink-0">
        <AvatarImage
          alt={member.name}
          src={getUserAvatarUrl(member.image, member.email)}
        />
        <AvatarFallback className="text-[0.625rem]">
          {shelfMemberInitial(member)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-sm">{member.name || member.email}</span>
    </span>
  );
}
