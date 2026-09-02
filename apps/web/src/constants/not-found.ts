import type { NotFoundLink } from "@/types/not-found";
import { DOCS_URL, SITE_URL } from "@/utils/urls";

export const MARKDOWN_CACHE_CONTROL = "public, max-age=300";

export const NOT_FOUND_AGENT_LINKS: NotFoundLink[] = [
  { label: "llms.txt", href: `${SITE_URL}/llms.txt` },
  { label: "sitemap.xml", href: `${SITE_URL}/sitemap.xml` },
  { label: "Docs", href: DOCS_URL },
];

export const NOT_FOUND_MARKDOWN = `# 404 Not Found

There is no page at this URL on ${new URL(SITE_URL).hostname}.

Start from one of these instead:

- [Site index for agents](${SITE_URL}/llms.txt)
- [Full site context](${SITE_URL}/llms-full.txt)
- [Sitemap](${SITE_URL}/sitemap.xml)
- [Documentation](${DOCS_URL})

Markdown versions of pages are served with \`Accept: text/markdown\` or by appending \`.md\` to the path.
`;
