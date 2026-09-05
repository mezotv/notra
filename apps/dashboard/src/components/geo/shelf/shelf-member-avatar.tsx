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
  showLabel = true,
}: GeoShelfMemberAvatarProps) {
  const label = member ? member.name || member.email : fallbackLabel;
  return (
    <span
      className={cn(
        "inline-flex items-center",
        showLabel ? "min-w-0 gap-2" : "shrink-0",
        !member && "text-muted-foreground",
        className
      )}
      title={member?.email ?? fallbackLabel}
    >
      {member ? (
        <Avatar className="size-6 shrink-0">
          <AvatarImage
            alt={label}
            src={getUserAvatarUrl(member.image, member.email)}
          />
          <AvatarFallback className="text-[0.625rem]">
            {shelfMemberInitial(member)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <span className="border-border inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed">
          <HugeiconsIcon className="size-3.5" icon={UserCircleIcon} />
        </span>
      )}
      {showLabel ? (
        <span className="truncate text-sm">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
}
