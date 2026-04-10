import { changelog } from "@/../.source/server";
import { markdownResponse, stripFrontmatter } from "@/utils/markdown";
import { getShowcaseCompany, getShowcaseEntrySlug } from "@/utils/showcase";

interface RouteProps {
  params: Promise<{ name: string; slug: string }>;
}

export async function GET(_: Request, { params }: RouteProps) {
  const { name, slug } = await params;
  const company = getShowcaseCompany(name);
  const entry = changelog.find(
    (item) =>
      item.info.path.startsWith(`${name}/`) &&
      getShowcaseEntrySlug(item.info.path) === slug
  );

  if (!company || !entry) {
    return markdownResponse("# Not found\n", 404);
  }

  try {
    const markdown = stripFrontmatter(await entry.getText("raw"));

    return markdownResponse(
      markdown.length > 0 ? `${markdown}\n` : "# Not found\n",
      markdown.length > 0 ? 200 : 404
    );
  } catch {
    return markdownResponse("# Not found\n", 404);
  }
}
