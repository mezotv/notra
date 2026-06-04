import { ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import Link from "next/link";
import type { BlogPaginationCardProps } from "~types/blog";

export function BlogPaginationCard({
  link,
  direction,
}: BlogPaginationCardProps) {
  const isPrevious = direction === "previous";
  const label = isPrevious ? "Previous" : "Next";
  const icon = isPrevious ? ArrowLeft02Icon : ArrowRight02Icon;
  const containerAlignment = isPrevious
    ? "items-start text-left"
    : "items-end text-right";
  const authorRowDirection = isPrevious ? "flex-row" : "flex-row-reverse";

  return (
    <Link
      className={`group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-neutral-50 dark:hover:bg-white/5 ${containerAlignment}`}
      href={link.href}
    >
      <span className="flex items-center gap-1 font-mono text-neutral-500 text-xs dark:text-neutral-400">
        {isPrevious ? (
          <>
            <HugeiconsIcon
              className="group-hover:-translate-x-0.5 size-3.5 transition-transform"
              icon={icon}
              strokeWidth={2}
            />
            {label}
          </>
        ) : (
          <>
            {label}
            <HugeiconsIcon
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              icon={icon}
              strokeWidth={2}
            />
          </>
        )}
      </span>
      <h3 className="line-clamp-2 font-sans font-semibold text-base text-foreground leading-snug transition-colors group-hover:text-primary">
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
    </Link>
  );
}
