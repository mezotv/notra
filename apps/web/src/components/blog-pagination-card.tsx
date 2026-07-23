import { ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Card } from "@notra/ui/components/ui/card";
import Link from "next/link";
import type { BlogPaginationCardProps } from "~types/blog";

export function BlogPaginationCard({
  link,
  direction,
  align,
}: BlogPaginationCardProps) {
  const isPrevious = direction === "previous";
  const isRight = align === "right";
  const label = isPrevious ? "Previous" : "Next";
  const icon = isRight ? ArrowRight02Icon : ArrowLeft02Icon;
  const containerAlignment = isRight
    ? "items-end text-right"
    : "items-start text-left";
  const authorRowDirection = isRight ? "flex-row-reverse" : "flex-row";

  return (
    <Link className="group block h-full" href={link.href}>
      <Card
        className={`h-full gap-3 p-5 transition-colors hover:bg-[#C8B2EE26] hover:ring-primary/40 dark:hover:bg-white/[0.04] ${containerAlignment}`}
      >
        <span className="flex items-center gap-1 font-mono text-neutral-500 text-xs dark:text-neutral-400">
          {isRight ? (
            <>
              {label}
              <HugeiconsIcon
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
                icon={icon}
                strokeWidth={2}
              />
            </>
          ) : (
            <>
              <HugeiconsIcon
                className="group-hover:-translate-x-0.5 size-3.5 transition-transform"
                icon={icon}
                strokeWidth={2}
              />
              {label}
            </>
          )}
        </span>
        <h3 className="line-clamp-2 font-display font-medium text-[#1E1E1E] text-base leading-snug tracking-[-0.01em] transition-colors group-hover:text-primary dark:text-white">
          {link.title}
        </h3>
        {link.author ? (
          <div
            className={`mt-auto flex items-center gap-2 font-sans text-muted-foreground text-sm ${authorRowDirection}`}
          >
            <Avatar className="size-6" size="sm">
              {link.author.image ? (
                <AvatarImage alt={link.author.name} src={link.author.image} />
              ) : null}
              <AvatarFallback className="text-xs">
                {link.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span>{link.author.name}</span>
          </div>
        ) : null}
      </Card>
    </Link>
  );
}
