import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import Link from "next/link";
import { ViewTransition } from "react";
import type { BlogPostCardProps } from "~types/blog";

import { formatBlogDate } from "@/utils/blog";
import { blogPostTitleTransitionName } from "@/utils/blog-view-transitions";

export function BlogPostCard({ item }: BlogPostCardProps) {
  return (
    <article className="group hover:border-primary/40 dark:hover:border-primary/40 flex h-full flex-col rounded-2xl border border-[#1E1E1E1A] bg-[#C8B2EE26] p-6 transition-colors hover:bg-[#C8B2EE40] dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
      <Link className="flex flex-col gap-3" href={item.href}>
        <ViewTransition name={blogPostTitleTransitionName(item.slug)}>
          <h2 className="font-display group-hover:text-primary text-xl font-medium tracking-[-0.015em] text-[#1E1E1E] transition-colors sm:text-2xl dark:text-white">
            {item.title}
          </h2>
        </ViewTransition>
        <p className="line-clamp-3 font-sans text-base leading-7 text-[#1E1E1E99] dark:text-white/60">
          {item.description}
        </p>
      </Link>

      <div className="mt-auto flex items-center gap-3 pt-6 font-sans text-sm text-[#1E1E1E99] dark:text-white/60">
        {item.author ? (
          <Link
            className="hover:text-foreground flex items-center gap-2 transition-colors"
            href={item.author.href}
          >
            <Avatar className="size-6" size="sm">
              {item.author.image ? (
                <AvatarImage alt={item.author.name} src={item.author.image} />
              ) : null}
              <AvatarFallback className="text-xs">
                {item.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span>{item.author.name}</span>
          </Link>
        ) : null}
        {item.author ? <span aria-hidden="true">·</span> : null}
        <time>{formatBlogDate(item.date)}</time>
      </div>
    </article>
  );
}
