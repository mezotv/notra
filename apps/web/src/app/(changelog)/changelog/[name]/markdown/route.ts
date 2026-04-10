import { changelog } from "@/../.source/server";
import { markdownResponse } from "@/utils/markdown";
import { getShowcaseCompany, getShowcaseEntrySlug } from "@/utils/showcase";

interface RouteProps {
  params: Promise<{ name: string }>;
}

export async function GET(_: Request, { params }: RouteProps) {
  const { name } = await params;
  const company = getShowcaseCompany(name);

  if (!company) {
    return markdownResponse("# Not found\n", 404);
  }

  const entries = changelog
    .filter((entry) => entry.info.path.startsWith(`${name}/`))
    .sort(
      (left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime()
    )
    .map(
      (entry) =>
        `- [${entry.title}](https://usenotra.com/changelog/${name}/${getShowcaseEntrySlug(entry.info.path)}.md) (${entry.date})`
    )
    .join("\n");

  const markdown = [
    `# ${company.name} Changelog`,
    "",
    company.description,
    "",
    `Website: ${company.url}`,
    "",
    "## Entries",
    "",
    entries || "No changelog entries found.",
    "",
  ].join("\n");

  return markdownResponse(markdown);
}
