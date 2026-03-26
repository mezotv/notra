import type { MetadataRoute } from "next";
import { changelog } from "@/../.source/server";
import { listNotraBlogPosts } from "@/utils/blog";
import { listNotraChangelogPosts } from "@/utils/changelog";
import { getShowcaseEntrySlug, SHOWCASE_COMPANIES } from "../utils/showcase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const showcaseEntries = SHOWCASE_COMPANIES.flatMap((company) =>
    changelog
      .filter((entry) => entry.info.path.startsWith(`${company.slug}/`))
      .map((entry) => ({
        url: `https://www.usenotra.com/changelog/${company.slug}/${getShowcaseEntrySlug(entry.info.path)}`,
        lastModified: new Date(entry.date),
      }))
  );

  const notraChangelogEntries = (await listNotraChangelogPosts()).map(
    (post) => ({
      url: `https://www.usenotra.com/changelog/notra/${post.slug}`,
      lastModified: new Date(post.updatedAt),
    })
  );

  const notraBlogEntries = (await listNotraBlogPosts()).map((post) => ({
    url: `https://www.usenotra.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
  }));

  return [
    {
      url: "https://www.usenotra.com",
      lastModified: new Date(),
    },
    {
      url: "https://www.usenotra.com/pricing",
      lastModified: new Date(),
    },
    {
      url: "https://www.usenotra.com/privacy",
      lastModified: new Date(),
    },
    {
      url: "https://www.usenotra.com/terms",
      lastModified: new Date(),
    },
    {
      url: "https://www.usenotra.com/legal",
      lastModified: new Date(),
    },
    {
      url: "https://www.usenotra.com/blog",
      lastModified: new Date(),
    },
    {
      url: "https://www.usenotra.com/changelog",
      lastModified: new Date(),
    },
    {
      url: "https://www.usenotra.com/changelog/notra",
      lastModified: new Date(),
    },
    ...SHOWCASE_COMPANIES.map((company) => ({
      url: `https://www.usenotra.com/changelog/${company.slug}`,
      lastModified: new Date(),
    })),
    ...showcaseEntries,
    ...notraChangelogEntries,
    ...notraBlogEntries,
  ];
}
