import { changelog } from "@/../.source/server";
import { listNotraBlogPosts } from "@/utils/blog";
import {
  getChangelogPostHref,
  listNotraChangelogPosts,
} from "@/utils/changelog";
import { stripFrontmatter } from "@/utils/markdown";
import {
  getShowcaseCompany,
  getShowcaseEntrySlug,
  SHOWCASE_COMPANIES,
} from "@/utils/showcase";
import {
  buildFeaturesMarkdown,
  buildLandingMarkdown,
  buildPricingMarkdown,
} from "@/utils/site-markdown";

const SITE_URL = "https://www.usenotra.com";

function absoluteUrl(path: string) {
  return `${SITE_URL}${path}`;
}

function formatLink(title: string, path: string, description?: string) {
  const suffix = description ? `: ${description}` : "";
  return `- [${title}](${absoluteUrl(path)})${suffix}`;
}

function sortShowcaseEntries() {
  return [...changelog].sort(
    (left, right) =>
      new Date(right.date).getTime() - new Date(left.date).getTime()
  );
}

async function buildShowcaseEntrySections() {
  const entries = sortShowcaseEntries();

  return Promise.all(
    entries.map(async (entry) => {
      const companySlug = entry.info.path.split("/")[0] ?? "";
      const company = getShowcaseCompany(companySlug);
      const slug = getShowcaseEntrySlug(entry.info.path);
      const content = stripFrontmatter(await entry.getText("raw"));

      return [
        `## ${company?.name ?? companySlug}: ${entry.title}`,
        "",
        `URL: ${absoluteUrl(`/changelog/${companySlug}/${slug}.md`)}`,
        `Date: ${entry.date}`,
        "",
        content,
        "",
      ].join("\n");
    })
  );
}

export async function buildLlmsText() {
  const blogPosts = await listNotraBlogPosts();
  const notraChangelogPosts = await listNotraChangelogPosts();

  return [
    "# Notra",
    "",
    "> Notra turns daily engineering work into publish-ready changelogs, blog posts, and social updates.",
    "",
    "## Main Pages",
    "",
    formatLink("Home", "/index.md", "Landing page overview"),
    formatLink(
      "Features",
      "/features.md",
      "Product capabilities and publishing workflows"
    ),
    formatLink("Pricing", "/pricing.md", "Plans and feature comparison"),
    formatLink("Blog", "/blog.md", "Index of Notra blog posts"),
    formatLink(
      "Changelog",
      "/changelog.md",
      "Index of Notra and showcase changelogs"
    ),
    formatLink(
      "Notra Changelog",
      "/changelog/notra.md",
      "Index of Notra product updates"
    ),
    "",
    "## Blog Posts",
    "",
    ...(blogPosts.length > 0
      ? blogPosts.map((post) =>
          formatLink(
            post.title,
            `/blog/${post.slug}.md`,
            `${post.createdAt} - ${post.excerpt}`
          )
        )
      : ["- None"]),
    "",
    "## Notra Changelog Entries",
    "",
    ...(notraChangelogPosts.length > 0
      ? notraChangelogPosts.map((post) =>
          formatLink(
            post.title,
            `${getChangelogPostHref(post.slug)}.md`,
            `${post.createdAt} - ${post.excerpt}`
          )
        )
      : ["- None"]),
    "",
    "## Example Company Changelogs",
    "",
    ...SHOWCASE_COMPANIES.map((company) =>
      formatLink(
        `${company.name} Changelog`,
        `/changelog/${company.slug}.md`,
        company.description
      )
    ),
    "",
    "## Example Company Entries",
    "",
    ...sortShowcaseEntries().map((entry) => {
      const companySlug = entry.info.path.split("/")[0] ?? "";
      const company = getShowcaseCompany(companySlug);
      const slug = getShowcaseEntrySlug(entry.info.path);

      return formatLink(
        `${company?.name ?? companySlug}: ${entry.title}`,
        `/changelog/${companySlug}/${slug}.md`,
        `${entry.date} - ${entry.description}`
      );
    }),
    "",
    `Full content: ${absoluteUrl("/llms-full.txt")}`,
    "",
  ].join("\n");
}

export async function buildLlmsFullText() {
  const blogPosts = await listNotraBlogPosts();
  const notraChangelogPosts = await listNotraChangelogPosts();
  const showcaseEntrySections = await buildShowcaseEntrySections();

  return [
    "# Notra",
    "",
    `Source index: ${absoluteUrl("/llms.txt")}`,
    "",
    "## Home",
    "",
    buildLandingMarkdown(),
    "",
    "## Features",
    "",
    buildFeaturesMarkdown(),
    "",
    "## Pricing",
    "",
    buildPricingMarkdown(),
    "",
    "## Blog",
    "",
    ...(blogPosts.length > 0
      ? blogPosts.flatMap((post) => [
          `### ${post.title}`,
          "",
          `URL: ${absoluteUrl(`/blog/${post.slug}.md`)}`,
          `Date: ${post.createdAt}`,
          "",
          post.markdown,
          "",
        ])
      : ["No blog posts found.", ""]),
    "## Notra Changelog",
    "",
    ...(notraChangelogPosts.length > 0
      ? notraChangelogPosts.flatMap((post) => [
          `### ${post.title}`,
          "",
          `URL: ${absoluteUrl(`${getChangelogPostHref(post.slug)}.md`)}`,
          `Date: ${post.createdAt}`,
          "",
          post.markdown,
          "",
        ])
      : ["No Notra changelog entries found.", ""]),
    "## Example Company Changelogs",
    "",
    ...showcaseEntrySections,
  ].join("\n");
}
