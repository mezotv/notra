import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import Link from "next/link";
import { ViewTransition } from "react";
import { getAuthorHref } from "@/utils/authors";
import {
  blogAuthorAvatarTransitionName,
  blogAuthorNameTransitionName,
} from "@/utils/blog-view-transitions";
import type { BlogPostAuthorCardProps } from "~types/blog";

export function BlogPostAuthorCard({ authors }: BlogPostAuthorCardProps) {
  if (authors.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-3 font-medium font-sans text-foreground text-sm">
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
                  <span className="font-medium font-sans text-neutral-700 text-sm leading-tight transition-colors group-hover:text-foreground dark:text-neutral-200">
                    {author.name}
                  </span>
                </ViewTransition>
                {author.role ? (
                  <span className="mt-0.5 font-sans text-neutral-500 text-xs leading-tight dark:text-neutral-400">
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
