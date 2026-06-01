import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import Link from "next/link";
import { formatBlogDate } from "@/utils/blog";
import type { BlogPostCardProps } from "~types/blog";

export function BlogPostCard({ item }: BlogPostCardProps) {
  return (
    <article className="group flex h-full flex-col">
      <Link className="flex flex-col gap-3" href={item.href}>
        <h2 className="font-sans font-semibold text-foreground text-xl tracking-tight transition-colors group-hover:text-primary sm:text-2xl">
          {item.title}
        </h2>
        <p className="line-clamp-3 font-sans text-base text-muted-foreground leading-7">
          {item.description}
        </p>
      </Link>

      <div className="mt-auto flex items-center gap-3 pt-6 font-sans text-muted-foreground text-sm">
        {item.author ? (
          <Link
            className="flex items-center gap-2 transition-colors hover:text-foreground"
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
