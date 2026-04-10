import {
  getChangelogPostHref,
  listNotraChangelogPosts,
} from "@/utils/changelog";
import { markdownResponse } from "@/utils/markdown";

export async function GET() {
  const posts = await listNotraChangelogPosts();

  const list = posts
    .map(
      (post) =>
        `- [${post.title}](https://usenotra.com${getChangelogPostHref(post.slug)}.md) (${post.createdAt})`
    )
    .join("\n");

  const markdown = [
    "# Notra Changelog",
    "",
    "The latest product updates, release notes, and improvements from the Notra team.",
    "",
    "## Entries",
    "",
    list || "No changelog entries found.",
    "",
  ].join("\n");

  return markdownResponse(markdown);
}
