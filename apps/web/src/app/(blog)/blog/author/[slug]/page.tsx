import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { buttonVariants } from "@notra/ui/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveSocialLink } from "@/utils/author-socials";
import {
  filterPostsByAuthorSlug,
  getNotraAuthorBySlug,
  listNotraAuthors,
} from "@/utils/authors";
import {
  buildBlogTimelineItems,
  formatBlogDate,
  listNotraBlogPosts,
} from "@/utils/blog";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";
import type { BlogAuthorPageProps } from "~types/blog";

export const revalidate = 3000;

export async function generateStaticParams() {
  const authors = await listNotraAuthors();
  return authors.map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({
  params,
}: BlogAuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getNotraAuthorBySlug(slug);

  if (!author) {
    return {};
  }

  const url = `${SITE_URL}/blog/author/${slug}`;
  const description = author.bio ?? `Articles written by ${author.name}.`;

  return {
    title: { absolute: `${author.name} — Notra Blog` },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: author.name,
      description,
      url,
      type: "profile",
      siteName: "Notra",
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: author.name,
      description,
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
  };
}

export default async function BlogAuthorPage({ params }: BlogAuthorPageProps) {
  const { slug } = await params;
  const author = await getNotraAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  const posts = await listNotraBlogPosts();
  const authorPosts = filterPostsByAuthorSlug(posts, slug);
  const timelineItems = buildBlogTimelineItems(authorPosts);
  const socials = author.socials
    .map(resolveSocialLink)
    .filter((social) => social !== null);
  const postLabel = authorPosts.length === 1 ? "post" : "posts";

  return (
    <>
      <div className="flex flex-col items-start gap-5">
        <Avatar className="size-20" size="default">
          {author.image ? (
            <AvatarImage alt={author.name} src={author.image} />
          ) : null}
          <AvatarFallback className="text-2xl">
            {author.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1">
          <h1 className="font-sans font-semibold text-4xl tracking-tight">
            {author.name}
          </h1>
          {author.role ? (
            <p className="font-mono text-foreground/50 text-sm">
              {author.role}
            </p>
          ) : null}
        </div>

        {socials.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {socials.map((social) => (
              <a
                aria-label={social.displayUrl}
                className={buttonVariants({ size: "icon", variant: "outline" })}
                href={social.url}
                key={social.url}
                rel="noopener"
                target="_blank"
              >
                <HugeiconsIcon
                  className="size-4"
                  icon={social.icon}
                  strokeWidth={2}
                />
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-14 border-border border-t pt-8">
        <h2 className="font-mono text-foreground/40 text-sm">
          {authorPosts.length} {postLabel}
        </h2>

        {timelineItems.length > 0 ? (
          <div className="mt-2 divide-y divide-border">
            {timelineItems.map((item) => (
              <Link
                className="group block py-8 first:pt-6"
                href={item.href}
                key={item.id}
              >
                <article>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-sans font-semibold text-foreground text-xl tracking-tight sm:text-2xl">
                      {item.title}
                    </h3>
                    <time className="shrink-0 pt-1 font-mono text-muted-foreground text-sm">
                      {formatBlogDate(item.date)}
                    </time>
                  </div>
                  <p className="mt-3 line-clamp-3 font-sans text-base text-muted-foreground leading-7">
                    {item.description}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 font-sans text-muted-foreground text-sm leading-6">
            No posts published yet.
          </p>
        )}
      </div>
    </>
  );
}
