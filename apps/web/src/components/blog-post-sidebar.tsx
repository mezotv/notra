import type { BlogPostSidebarProps } from "~types/blog";

import { BlogPostAuthorCard } from "@/components/blog-post-author-card";
import { BlogPostToc } from "@/components/blog-post-toc";

export function BlogPostSidebar({ authors, toc }: BlogPostSidebarProps) {
  return (
    <aside className="hidden lg:block">
      <BlogPostAuthorCard authors={authors} />
      <div className="sticky top-8 mt-8">
        <BlogPostToc toc={toc} />
      </div>
    </aside>
  );
}
