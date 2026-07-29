"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Badge } from "@notra/ui/components/ui/badge";
import { Card, CardContent } from "@notra/ui/components/ui/card";
import Link from "next/link";
import { PERSONA_SOCIAL_PLATFORMS } from "@/constants/personas";
import type { PersonaCardProps } from "@/types/components/personas";

export function PersonaCard({ persona, slug }: PersonaCardProps) {
  const linkedPlatforms = PERSONA_SOCIAL_PLATFORMS.filter((platform) =>
    persona.socials.some((social) => social.platform === platform.value)
  );

  return (
    <Link
      className="group block"
      href={`/${slug}/personas/${persona.id}`}
      key={persona.id}
    >
      <Card className="h-full gap-3 transition-all group-hover:ring-foreground/20">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              <AvatarImage
                alt={persona.name}
                src={persona.avatarUrl ?? undefined}
              />
              <AvatarFallback className="text-lg">
                {persona.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{persona.name}</p>
              <p className="truncate text-muted-foreground text-sm">
                {persona.title ?? "No title"}
              </p>
            </div>
          </div>
          {persona.bio ? (
            <p className="line-clamp-2 text-muted-foreground text-sm">
              {persona.bio}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {persona.linkedMember ? (
              <Badge variant="secondary">
                Linked to {persona.linkedMember.name}
              </Badge>
            ) : (
              <Badge variant="outline">Not linked</Badge>
            )}
            <Badge variant="outline">
              {persona.referenceCount}{" "}
              {persona.referenceCount === 1 ? "reference" : "references"}
            </Badge>
          </div>
          {linkedPlatforms.length > 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              {linkedPlatforms.map((platform) => (
                <HugeiconsIcon
                  className="size-4"
                  icon={platform.icon}
                  key={platform.value}
                />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
