import type { MetadataRoute } from "next";
import { changelog } from "@/../.source/server";
import { CHANGELOG_COMPANIES, getEntrySlug } from "../utils/changelog";

export default function sitemap(): MetadataRoute.Sitemap {
  const changelogEntries = CHANGELOG_COMPANIES.flatMap((company) =>
    changelog
      .filter((entry) => entry.info.path.startsWith(`${company.slug}/`))
      .map((entry) => ({
        url: `https://www.usenotra.com/changelog/${company.slug}/${getEntrySlug(entry.info.path)}`,
        lastModified: new Date(entry.date),
      }))
  );

  return [
    {
      url: "https://www.usenotra.com",
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
      url: "https://www.usenotra.com/changelog",
      lastModified: new Date(),
    },
    ...CHANGELOG_COMPANIES.map((company) => ({
      url: `https://www.usenotra.com/changelog/${company.slug}`,
      lastModified: new Date(),
    })),
    ...changelogEntries,
  ];
}
