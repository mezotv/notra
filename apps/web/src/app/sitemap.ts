import type { MetadataRoute } from "next";
import { changelog } from "@/../.source/server";
import { listNotraBlogPosts } from "@/utils/blog";
import { listNotraChangelogPosts } from "@/utils/changelog";
import { SITE_URL } from "@/utils/metadata";
import { getShowcaseEntrySlug, SHOWCASE_COMPANIES } from "../utils/showcase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const showcaseEntries = SHOWCASE_COMPANIES.flatMap((company) =>
    changelog
      .filter((entry) => entry.info.path.startsWith(`${company.slug}/`))
      .map((entry) => ({
        url: `${SITE_URL}/changelog/${company.slug}/${getShowcaseEntrySlug(entry.info.path)}`,
        lastModified: new Date(entry.date),
      }))
  );

  const notraChangelogEntries = (await listNotraChangelogPosts()).map(
    (post) => ({
      url: `${SITE_URL}/changelog/notra/${post.slug}`,
      lastModified: new Date(post.updatedAt),
    })
  );

  const notraBlogEntries = (await listNotraBlogPosts()).map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/contributors`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/legal`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/changelog`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/changelog/notra`,
      lastModified: new Date(),
    },
    ...SHOWCASE_COMPANIES.map((company) => ({
      url: `${SITE_URL}/changelog/${company.slug}`,
      lastModified: new Date(),
    })),
    ...showcaseEntries,
    ...notraChangelogEntries,
    ...notraBlogEntries,
  ];
}
