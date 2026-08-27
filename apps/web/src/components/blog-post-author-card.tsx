import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import Link from "next/link";
import { ViewTransition } from "react";
import type { BlogPostAuthorCardProps } from "~types/blog";

import { getAuthorHref } from "@/utils/authors";
import {
  blogAuthorAvatarTransitionName,
  blogAuthorNameTransitionName,
} from "@/utils/blog-view-transitions";

export function BlogPostAuthorCard({ authors }: BlogPostAuthorCardProps) {
  if (authors.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-foreground mb-3 font-sans text-sm font-medium">
        Written by
      </p>
      <ul className="flex flex-col gap-3">
        {authors.map((author) => (
          <li key={author.id}>
            <Link
              className="group flex items-center gap-3"
              href={getAuthorHref(author.slug)}
            >
              <ViewTransition
                name={blogAuthorAvatarTransitionName(author.slug)}
              >
                <Avatar size="sm">
                  {author.image ? (
                    <AvatarImage alt={author.name} src={author.image} />
                  ) : null}
                  <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </ViewTransition>
              <span className="flex flex-col">
                <ViewTransition
                  name={blogAuthorNameTransitionName(author.slug)}
                >
                  <span className="group-hover:text-foreground font-sans text-sm leading-tight font-medium text-neutral-700 transition-colors dark:text-neutral-200">
                    {author.name}
                  </span>
                </ViewTransition>
                {author.role ? (
                  <span className="mt-0.5 font-sans text-xs leading-tight text-neutral-500 dark:text-neutral-400">
                    {author.role}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
