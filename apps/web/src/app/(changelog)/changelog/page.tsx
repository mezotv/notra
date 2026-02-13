import { BetterAuthLight } from "@notra/ui/components/ui/svgs/betterAuthLight";
import { Cal } from "@notra/ui/components/ui/svgs/cal";
import { Databuddy } from "@notra/ui/components/ui/svgs/databuddy";
import { Langfuse } from "@notra/ui/components/ui/svgs/langfuse";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { changelog } from "@/../.source/server";
import { CHANGELOG_COMPANIES } from "../../../utils/changelog";

const COMPANY_ICONS: Record<string, ReactNode> = {
  "better-auth": <BetterAuthLight className="size-5" />,
  "cal-com": <Cal className="size-5" />,
  databuddy: <Databuddy className="size-5 rounded" />,
  langfuse: <Langfuse className="size-5" />,
};

const title = "Example Changelogs | Notra";
const description =
  "See what AI-generated changelogs look like for popular open source projects, powered by Notra.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://usenotra.com/changelog" },
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

export default function ChangelogOverviewPage() {
  return (
    <>
      <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4 self-center">
        <h1 className="text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
          Example Changelogs<span className="text-primary">.</span>
        </h1>
        <p className="text-center font-normal font-sans text-base text-muted-foreground leading-7">
          See how Notra transforms GitHub activity into professional
          <br className="hidden sm:block" />
          product updates from real open source projects.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CHANGELOG_COMPANIES.map((company) => {
          const entryCount = changelog.filter((e) =>
            e.info.path.startsWith(`${company.slug}/`)
          ).length;

          return (
            <Link
              className="rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={`/changelog/${company.slug}`}
              key={company.slug}
            >
              <TitleCard
                accentColor={company.accentColor}
                action={
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-muted-foreground text-xs">
                    {entryCount} {entryCount === 1 ? "Post" : "Posts"}
                  </span>
                }
                className="h-full cursor-pointer transition-colors hover:bg-muted/80"
                heading={company.name}
                icon={COMPANY_ICONS[company.slug]}
              >
                <p className="text-muted-foreground text-sm">
                  {company.description}
                </p>
              </TitleCard>
            </Link>
          );
        })}
      </div>

      <p className="mt-8 text-center font-sans text-muted-foreground text-xs">
        Notra is not affiliated with any of the companies listed above. These
        changelogs are generated for demonstration purposes only.
      </p>
    </>
  );
}
