import { listNotraBlogPosts } from "@/utils/blog";
import { markdownResponse } from "@/utils/markdown";

export async function GET() {
  const posts = await listNotraBlogPosts();

  const list = posts
    .map(
      (post) =>
        `- [${post.title}](https://usenotra.com/blog/${post.slug}.md) (${post.createdAt})`
    )
    .join("\n");

  const markdown = [
    "# Notra Blog",
    "",
    "Insights, guides, and stories from the Notra team.",
    "",
    "## Posts",
    "",
    list || "No blog posts found.",
    "",
  ].join("\n");

  return markdownResponse(markdown);
}
