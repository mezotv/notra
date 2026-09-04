"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";

import { ShelfTicketBadge } from "@/components/geo/shelf/shelf-ticket-badge";
import { TrafficBreakdownCard } from "@/components/geo/traffic-breakdown-card";
import type { GeoShelfTicketAssigneeCardProps } from "@/types/geo-shelf";
import { getUserAvatarUrl } from "@/utils/avatar";
import { formatRelative } from "@/utils/format-relative";
import { shelfMemberInitial } from "@/utils/geo-shelf";

export function ShelfTicketAssigneeCard({
  member,
  ticketCreatedAt,
  status,
}: GeoShelfTicketAssigneeCardProps) {
  const name = member.name || member.email;
  return (
    <TrafficBreakdownCard
      align="end"
      aside={<ShelfTicketBadge status={status} />}
      icon={
        <Avatar className="size-5">
          <AvatarImage
            alt={name}
            src={getUserAvatarUrl(member.image, member.email)}
          />
          <AvatarFallback className="text-[0.625rem]">
            {shelfMemberInitial(member)}
          </AvatarFallback>
        </Avatar>
      }
      title={name}
    >
      <p className="text-muted-foreground px-3 py-1.5 text-xs text-pretty">
        Ticket opened {formatRelative(ticketCreatedAt)}
      </p>
    </TrafficBreakdownCard>
  );
}
