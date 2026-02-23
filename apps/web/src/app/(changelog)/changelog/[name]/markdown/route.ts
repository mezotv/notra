import { changelog } from "@/../.source/server";
import { getCompany, getEntrySlug } from "@/utils/changelog";
import { markdownResponse } from "@/utils/markdown";

interface RouteProps {
  params: Promise<{ name: string }>;
}

export async function GET(_: Request, { params }: RouteProps) {
  const { name } = await params;
  const company = getCompany(name);

  if (!company) {
    return markdownResponse("# Not found\n", 404);
  }

  const entries = changelog
    .filter((entry) => entry.info.path.startsWith(`${name}/`))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const list = entries
    .map((entry) => {
      const slug = getEntrySlug(entry.info.path);
      return `- [${entry.title}](https://usenotra.com/changelog/${name}/${slug}.md) (${entry.date})`;
    })
    .join("\n");

  const markdown = [
    `# ${company.name} Changelog`,
    "",
    company.description,
    "",
    "## Entries",
    "",
    list || "No changelog entries found.",
    "",
  ].join("\n");

  return markdownResponse(markdown);
}
