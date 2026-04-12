import path from "node:path";
import { readFile } from "node:fs/promises";
import { changelog } from "@/../.source/server";
import { markdownResponse, stripFrontmatter } from "@/utils/markdown";
import { getShowcaseCompany, getShowcaseEntrySlug } from "@/utils/showcase";

interface RouteProps {
  params: Promise<{ name: string; slug: string }>;
}

async function getShowcaseEntryMarkdown(
  name: string,
  slug: string,
  entry: (typeof changelog)[number]
) {
  try {
    return stripFrontmatter(await entry.getText("raw"));
  } catch {
    const candidatePaths = [
      path.join(process.cwd(), "src/content/changelog", name, `${slug}.mdx`),
      path.join(
        process.cwd(),
        "apps/web/src/content/changelog",
        name,
        `${slug}.mdx`
      ),
    ];

    for (const filePath of candidatePaths) {
      try {
        return stripFrontmatter(await readFile(filePath, "utf8"));
      } catch {}
    }

    throw new Error(`Unable to load changelog source for ${name}/${slug}`);
  }
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
    const markdown = await getShowcaseEntryMarkdown(name, slug, entry);

    return markdownResponse(
      markdown.length > 0 ? `${markdown}\n` : "# Not found\n",
      markdown.length > 0 ? 200 : 404
    );
  } catch {
    return markdownResponse("# Not found\n", 404);
  }
}
