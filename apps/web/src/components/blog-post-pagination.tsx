import { BlogPaginationCard } from "@/components/blog-pagination-card";
import type { BlogPostPaginationProps } from "~types/blog";

export function BlogPostPagination({
  previous,
  next,
}: BlogPostPaginationProps) {
  if (!(previous || next)) {
    return null;
  }

  return (
    <nav
      aria-label="Blog post navigation"
      className="mt-16 grid gap-4 border-border border-t pt-8 sm:grid-cols-2"
    >
      {previous ? (
        <BlogPaginationCard direction="previous" link={previous} />
      ) : (
        <div aria-hidden="true" className="hidden sm:block" />
      )}
      {next ? (
        <BlogPaginationCard direction="next" link={next} />
      ) : (
        <div aria-hidden="true" className="hidden sm:block" />
      )}
    </nav>
  );
}
