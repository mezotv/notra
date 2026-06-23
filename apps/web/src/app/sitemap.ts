import type { MetadataRoute } from "next";
import { changelog } from "@/../.source/server";
import {
  filterPostsByAuthorSlug,
  getAuthorHref,
  listNotraAuthors,
} from "@/utils/authors";
import { listNotraBlogPosts } from "@/utils/blog";
import { listNotraChangelogPosts } from "@/utils/changelog";
import { SITE_URL } from "@/utils/urls";
import { getShowcaseEntrySlug, SHOWCASE_COMPANIES } from "../utils/showcase";

const STATIC_PAGE_LAST_MODIFIED = new Date("2026-04-24");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const showcaseEntries = SHOWCASE_COMPANIES.flatMap((company) =>
    changelog.flatMap((entry) =>
      entry.info.path.startsWith(`${company.slug}/`)
        ? [
            {
              url: `${SITE_URL}/changelog/${company.slug}/${getShowcaseEntrySlug(entry.info.path)}`,
              lastModified: new Date(entry.date),
            },
          ]
        : []
    )
  );

  const notraChangelogEntries = (await listNotraChangelogPosts()).map(
    (post) => ({
      url: `${SITE_URL}/changelog/notra/${post.slug}`,
      lastModified: new Date(post.updatedAt),
    })
  );

  const notraBlogPosts = await listNotraBlogPosts();
  const notraBlogEntries = notraBlogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
  }));

  const notraAuthorEntries = (await listNotraAuthors()).map((author) => {
    const lastModified = filterPostsByAuthorSlug(
      notraBlogPosts,
      author.slug
    ).reduce<Date>((latest, post) => {
      const postDate = new Date(post.updatedAt);
      return postDate > latest ? postDate : latest;
    }, STATIC_PAGE_LAST_MODIFIED);

    return {
      url: `${SITE_URL}${getAuthorHref(author.slug)}`,
      lastModified,
    };
  });

  const latestNotraChangelog = notraChangelogEntries.reduce<Date>(
    (latest, entry) =>
      entry.lastModified > latest ? entry.lastModified : latest,
    STATIC_PAGE_LAST_MODIFIED
  );

  const latestBlog = notraBlogEntries.reduce<Date>(
    (latest, entry) =>
      entry.lastModified > latest ? entry.lastModified : latest,
    STATIC_PAGE_LAST_MODIFIED
  );

  const latestShowcaseByCompany = new Map<string, Date>();
  for (const company of SHOWCASE_COMPANIES) {
    const latest = changelog.reduce<Date>((acc, entry) => {
      if (!entry.info.path.startsWith(`${company.slug}/`)) {
        return acc;
      }

      const entryDate = new Date(entry.date);
      return entryDate > acc ? entryDate : acc;
    }, STATIC_PAGE_LAST_MODIFIED);
    latestShowcaseByCompany.set(company.slug, latest);
  }

  const latestShowcaseAny = [...latestShowcaseByCompany.values()].reduce<Date>(
    (latest, date) => (date > latest ? date : latest),
    STATIC_PAGE_LAST_MODIFIED
  );

  return [
    {
      url: SITE_URL,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/features`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/brand`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/contributors`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/oss-program`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/twitter-thread-creator`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/html-to-figma`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/html-to-paper`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/legal`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/subprocessors`,
      lastModified: STATIC_PAGE_LAST_MODIFIED,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: latestBlog,
    },
    {
      url: `${SITE_URL}/changelog`,
      lastModified: latestShowcaseAny,
    },
    {
      url: `${SITE_URL}/changelog/notra`,
      lastModified: latestNotraChangelog,
    },
    ...SHOWCASE_COMPANIES.map((company) => ({
      url: `${SITE_URL}/changelog/${company.slug}`,
      lastModified:
        latestShowcaseByCompany.get(company.slug) ?? STATIC_PAGE_LAST_MODIFIED,
    })),
    ...showcaseEntries,
    ...notraChangelogEntries,
    ...notraBlogEntries,
    ...notraAuthorEntries,
  ];
}
