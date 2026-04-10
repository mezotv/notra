import { getNotraBlogPostBySlug } from "@/utils/blog";
import { markdownResponse } from "@/utils/markdown";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export async function GET(_: Request, { params }: RouteProps) {
  const { slug } = await params;
  const post = await getNotraBlogPostBySlug(slug);

  if (!post) {
    return markdownResponse("# Not found\n", 404);
  }

  const markdown = [
    `# ${post.title}`,
    "",
    `Date: ${post.createdAt}`,
    "",
    post.markdown,
    "",
  ].join("\n");

  return markdownResponse(markdown);
}
