import { markdownResponse } from "@/utils/markdown";
import { SHOWCASE_COMPANIES } from "@/utils/showcase";

export async function GET() {
  const list = [
    "- [Notra](https://usenotra.com/changelog/notra.md)",
    ...SHOWCASE_COMPANIES.map(
      (company) =>
        `- [${company.name}](https://usenotra.com/changelog/${company.slug}.md)`
    ),
  ].join("\n");

  const markdown = [
    "# Changelog",
    "",
    "See how Notra transforms GitHub activity into professional product updates from real open source projects.",
    "",
    "## Changelogs",
    "",
    list,
    "",
  ].join("\n");

  return markdownResponse(markdown);
}
