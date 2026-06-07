import { BlogPostCard } from "@/components/blog-post-card";
import type { BlogCardGridProps } from "~types/blog";

export function BlogCardGrid({
  items,
  emptyTitle,
  emptyDescription,
}: BlogCardGridProps) {
  if (items.length === 0) {
    return (
      <div className="w-full">
        <div className="rounded-2xl border border-border border-dashed bg-muted/30 px-6 py-12 text-center">
          <h2 className="font-sans font-semibold text-foreground text-xl">
            {emptyTitle}
          </h2>
          <p className="mt-2 font-sans text-muted-foreground text-sm leading-6">
            {emptyDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="grid w-full grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
      {items.map((item) => (
        <li className="h-full" key={item.id}>
          <BlogPostCard item={item} />
        </li>
      ))}
    </ul>
  );
}
