"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { MessageAuthorAvatarProps } from "@/types/components/chat-page";
import { getUserAvatarUrl } from "@/utils/avatar";

const AVATAR_TRANSITION = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as const,
};

const AVATAR_SIZE_PX = {
  default: 32,
  sm: 16,
} as const;

export function MessageAuthorAvatar({
  author,
  size = "default",
}: MessageAuthorAvatarProps) {
  const label = author.name ?? "Former member";
  const reduceMotion = useReducedMotion();
  const pixelSize = AVATAR_SIZE_PX[size];

  return (
    <m.div
      animate={{ opacity: 1, width: pixelSize }}
      className={cn("shrink-0 overflow-hidden", size === "default" && "mt-1.5")}
      initial={reduceMotion ? false : { opacity: 0, width: 0 }}
      transition={AVATAR_TRANSITION}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              aria-label={label}
              className="block rounded-full"
              type="button"
            />
          }
        >
          <Avatar className={size === "sm" ? "size-4" : "size-8"}>
            <AvatarImage
              alt={label}
              src={getUserAvatarUrl(author.image, author.seed)}
            />
            <AvatarFallback>
              {author.name ? author.name.charAt(0).toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </m.div>
  );
}
