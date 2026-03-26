import type { Metadata } from "next";
import Link from "next/link";
import {
  buildBlogTimelineItems,
  formatBlogDate,
  listNotraBlogPosts,
} from "@/utils/blog";

const title = "Notra Blog";
const description = "Insights, guides, and stories from the Notra team.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://usenotra.com/blog",
  },
  openGraph: {
    title,
    description,
    url: "https://usenotra.com/blog",
    type: "website",
    siteName: "Notra",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function BlogPage() {
  const posts = await listNotraBlogPosts();
  const timelineItems = buildBlogTimelineItems(posts);

  if (timelineItems.length === 0) {
    return (
      <>
        <div className="flex w-full max-w-[680px] flex-col items-center justify-start gap-4 self-center text-center">
          <h1 className="text-balance font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
            The Notra <span className="text-primary">Blog</span>
          </h1>
          <div className="text-balance font-sans text-base text-muted-foreground leading-7">
            Insights, guides, and stories from the Notra team.
          </div>
        </div>

        <div className="mt-14 w-full max-w-[760px] self-center">
          <div className="rounded-2xl border border-border border-dashed bg-muted/30 px-6 py-12 text-center">
            <h2 className="font-sans font-semibold text-foreground text-xl">
              No posts yet
            </h2>
            <p className="mt-2 font-sans text-muted-foreground text-sm leading-6">
              We&apos;ll share new articles and insights here soon.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex w-full max-w-[680px] flex-col items-center justify-start gap-4 self-center text-center">
        <h1 className="text-balance font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
          The Notra <span className="text-primary">Blog</span>
        </h1>
        <div className="text-balance font-sans text-base text-muted-foreground leading-7">
          Insights, guides, and stories from the Notra team.
        </div>
      </div>

      <div className="mt-14 grid w-full max-w-[760px] gap-8 self-center">
        {timelineItems.map((item) => (
          <Link className="group block" href={item.href} key={item.id}>
            <article className="rounded-2xl border border-border bg-card/50 p-6 transition-colors hover:border-primary/30 hover:bg-card sm:p-8">
              <time className="block font-sans text-foreground/45 text-sm">
                {formatBlogDate(item.date)}
              </time>
              <h2 className="mt-2 font-sans font-semibold text-foreground text-xl tracking-tight transition-colors group-hover:text-primary sm:text-2xl">
                {item.title}
              </h2>
              <p className="mt-2 line-clamp-3 font-sans text-muted-foreground text-sm leading-6 sm:text-base">
                {item.description}
              </p>
              <span className="mt-4 inline-block font-medium font-sans text-primary text-sm">
                Read more &rarr;
              </span>
            </article>
          </Link>
        ))}
      </div>
    </>
  );
}
