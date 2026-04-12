import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { changelog } from "@/../.source/server";
import { ChangelogPageHeader } from "@/components/changelog-page-header";
import { ChangelogTimeline } from "@/components/changelog-timeline";
import {
  getShowcaseCompany,
  getShowcaseEntrySlug,
  SHOWCASE_COMPANIES,
} from "@/utils/showcase";
import type { ShowcaseCompanyPageProps } from "~types/showcase";

export function generateStaticParams() {
  return SHOWCASE_COMPANIES.map((company) => ({ name: company.slug }));
}

export async function generateMetadata({
  params,
}: ShowcaseCompanyPageProps): Promise<Metadata> {
  const { name } = await params;
  const company = getShowcaseCompany(name);

  if (!company) {
    return {};
  }

  const title = { absolute: `${company.name} Changelog` };
  const description = `${company.description} See AI-generated changelogs powered by Notra.`;
  const url = `https://usenotra.com/changelog/${name}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: title.absolute,
      description,
      url,
      type: "website",
      siteName: "Notra",
    },
    twitter: {
      card: "summary_large_image",
      title: title.absolute,
      description,
    },
  };
}

export default async function ShowcaseCompanyPage({
  params,
}: ShowcaseCompanyPageProps) {
  const { name } = await params;
  const company = getShowcaseCompany(name);

  if (!company) {
    notFound();
  }

  const items = changelog
    .filter((entry) => entry.info.path.startsWith(`${name}/`))
    .sort(
      (left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime()
    )
    .map((entry) => ({
      id: entry.info.path,
      title: entry.title,
      description: entry.description,
      href: `/changelog/${name}/${getShowcaseEntrySlug(entry.info.path)}`,
      date: entry.date,
    }));

  return (
    <>
      <Link
        className="inline-flex items-center gap-1 font-sans text-foreground/50 text-sm transition-colors hover:text-foreground"
        href="/changelog"
      >
        &larr; All changelogs
      </Link>

      <div className="mt-8 flex flex-col items-center">
        <ChangelogPageHeader
          description={
            <>
              Changelog entries generated from GitHub activity,
              <br className="hidden sm:block" />
              powered by Notra.
            </>
          }
          meta={
            <a
              className="inline-flex items-center gap-1 font-sans text-muted-foreground/60 text-sm transition-colors hover:text-foreground"
              href={`${company.url}?utm_source=usenotra.com`}
              target="_blank"
            >
              {company.domain}
              <HugeiconsIcon className="size-3.5" icon={ArrowUpRight01Icon} />
            </a>
          }
          title={
            <>
              {company.name} <span className="text-primary">Changelog</span>
            </>
          }
        />
      </div>

      <div className="mt-14 w-full max-w-[720px] self-center">
        <ChangelogTimeline items={items} />
      </div>
    </>
  );
}
