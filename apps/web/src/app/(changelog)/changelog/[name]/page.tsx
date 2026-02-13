import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { changelog } from "@/../.source/server";
import {
  CHANGELOG_COMPANIES,
  getCompany,
  getEntrySlug,
} from "../../../../utils/changelog";

interface PageProps {
  params: Promise<{ name: string }>;
}

export function generateStaticParams() {
  return CHANGELOG_COMPANIES.map((c) => ({ name: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name } = await params;
  const company = getCompany(name);
  if (!company) {
    return {};
  }

  const title = `${company.name} Changelog | Notra`;
  const description = `${company.description} See AI-generated changelogs powered by Notra.`;
  const url = `https://usenotra.com/changelog/${name}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Notra",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CompanyChangelogPage({ params }: PageProps) {
  const { name } = await params;
  const company = getCompany(name);
  if (!company) {
    notFound();
  }

  const entries = changelog
    .filter((entry) => entry.info.path.startsWith(`${name}/`))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <Link
        className="inline-flex items-center gap-1 font-sans text-foreground/50 text-sm transition-colors hover:text-foreground"
        href="/changelog"
      >
        &larr; All companies
      </Link>

      <div className="mt-8 flex w-full max-w-[586px] flex-col items-center gap-4 self-center">
        <h1 className="text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
          {company.name} Changelog<span className="text-primary">.</span>
        </h1>
        <p className="text-center font-normal font-sans text-base text-muted-foreground leading-7">
          AI-generated changelog entries from GitHub activity,
          <br className="hidden sm:block" />
          powered by Notra.
        </p>
      </div>

      <div className="mt-14 flex w-full flex-col">
        {entries.map((entry, index) => {
          const slug = getEntrySlug(entry.info.path);
          return (
            <Link
              className="group block border-border py-8 first:pt-0"
              href={`/changelog/${name}/${slug}`}
              key={entry.info.path}
              style={{
                borderTopWidth: index === 0 ? 0 : 1,
              }}
            >
              <h2 className="font-sans font-semibold text-foreground text-lg tracking-tight transition-colors group-hover:text-primary sm:text-xl">
                {entry.title}
              </h2>
              <p className="mt-1 line-clamp-2 font-sans text-muted-foreground text-sm leading-6">
                {entry.description}
              </p>
              <time className="mt-2 block font-sans text-foreground/40 text-sm">
                {new Date(entry.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </Link>
          );
        })}
      </div>
    </>
  );
}
