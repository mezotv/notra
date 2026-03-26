import type { Metadata } from "next";
import { changelog } from "@/../.source/server";
import { ChangelogPageHeader } from "@/components/changelog-page-header";
import { ShowcaseOverviewGrid } from "@/components/showcase-overview-grid";
import { SHOWCASE_COMPANIES } from "@/utils/showcase";
import { SHOWCASE_COMPANY_ICONS } from "@/utils/showcase-icons";

const title = "Changelog";
const description =
  "See how Notra transforms GitHub activity into professional product updates from real open source projects.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://usenotra.com/changelog",
  },
  openGraph: {
    title,
    description,
    url: "https://usenotra.com/changelog",
    type: "website",
    siteName: "Notra",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function ChangelogHubPage() {
  const postCounts = new Map(
    SHOWCASE_COMPANIES.map((company) => [
      company.slug,
      changelog.filter((entry) =>
        entry.info.path.startsWith(`${company.slug}/`)
      ).length,
    ])
  );

  const companies = [...SHOWCASE_COMPANIES]
    .sort((left, right) => {
      const countDifference =
        (postCounts.get(right.slug) ?? 0) - (postCounts.get(left.slug) ?? 0);

      if (countDifference !== 0) {
        return countDifference;
      }

      return left.name.localeCompare(right.name);
    })
    .map((company) => ({
      ...company,
      entryCount: postCounts.get(company.slug) ?? 0,
      icon: SHOWCASE_COMPANY_ICONS[company.slug],
    }));

  return (
    <>
      <ChangelogPageHeader
        description={
          <>
            See how Notra transforms GitHub activity into professional
            <br className="hidden sm:block" />
            product updates from real open source projects.
          </>
        }
        title={
          <>
            Example <span className="text-primary">Changelogs</span>
          </>
        }
      />

      <ShowcaseOverviewGrid companies={companies} />

      <p className="mt-8 text-center font-sans text-muted-foreground text-xs">
        Notra is not affiliated with any of the companies listed above. These
        changelogs are generated for demonstration purposes only.
      </p>
    </>
  );
}
