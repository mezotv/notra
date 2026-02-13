import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { changelog } from "@/../.source/server";
import {
  CHANGELOG_COMPANIES,
  getCompany,
  getEntrySlug,
} from "../../../../../utils/changelog";

interface PageProps {
  params: Promise<{ name: string; slug: string }>;
}

export function generateStaticParams() {
  return CHANGELOG_COMPANIES.flatMap((company) =>
    changelog
      .filter((entry) => entry.info.path.startsWith(`${company.slug}/`))
      .map((entry) => ({
        name: company.slug,
        slug: getEntrySlug(entry.info.path),
      }))
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name, slug } = await params;
  const company = getCompany(name);
  const entry = changelog.find((e) => e.info.path === `${name}/${slug}.mdx`);
  if (!company || !entry) {
    return {};
  }

  return {
    title: `${entry.title} - ${company.name} Changelog`,
    description: `AI-generated changelog entry for ${company.name}: ${entry.title}.`,
  };
}

export default async function ChangelogEntryPage({ params }: PageProps) {
  const { name, slug } = await params;
  const company = getCompany(name);
  const entry = changelog.find((e) => e.info.path === `${name}/${slug}.mdx`);
  if (!company || !entry) {
    notFound();
  }

  const MDX = entry.body;

  return (
    <>
      <Link
        className="mb-6 inline-flex items-center gap-1 font-sans text-foreground/50 text-sm transition-colors hover:text-foreground"
        href={`/changelog/${name}`}
      >
        &larr; {company.name}
      </Link>

      <h1 className="font-sans font-semibold text-3xl tracking-tight sm:text-4xl">
        {entry.title}
      </h1>
      <time className="mt-2 block font-sans text-foreground/40 text-sm">
        {new Date(entry.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>

      <p className="mt-4 font-sans text-foreground/50 text-xs">
        This changelog is AI-generated for demonstration purposes. Notra is not
        affiliated with {company.name}.
      </p>

      <article className="prose prose-neutral mt-8 max-w-none prose-headings:font-sans prose-headings:font-semibold prose-p:font-sans prose-a:text-primary prose-li:text-foreground/80 prose-p:text-foreground/80 prose-strong:text-foreground prose-p:leading-7 prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline">
        <MDX />
      </article>
    </>
  );
}
