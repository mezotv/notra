import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import { OssApplicationForm } from "@/components/oss-program/oss-application-form";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const title = "OSS Program";
const description =
  "Notra is free for open source builders. Get the Pro plan at no cost in exchange for feedback, and turn your shipped work into changelogs, launch posts, and marketing assets.";
const url = `${SITE_URL}/oss-program`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: "website",
    siteName: "Notra",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [DEFAULT_SOCIAL_IMAGE.url],
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
};

const BENEFITS = [
  {
    label: "Free Notra Pro plan",
    detail:
      "Full access to the $50/mo Pro plan for as long as you're in the program. No credit card needed.",
  },
  {
    label: "Content from your shipped work",
    detail:
      "Turn commits, PRs, and releases into changelogs, launch posts, and social updates.",
  },
  {
    label: "Marketing assets in your voice",
    detail:
      "Generate launch visuals and copy that sound like your project, not a template.",
  },
  {
    label: "A direct line to the team",
    detail: "Shape the roadmap with your feedback. That's the whole trade.",
  },
] as const;

const OSI_LICENSES_URL = "https://opensource.org/licenses";

const ELIGIBILITY = [
  {
    id: "public",
    content: "Your project is publicly available on GitHub.",
  },
  {
    id: "license",
    content: (
      <>
        It's licensed under an{" "}
        <a
          className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
          href={OSI_LICENSES_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          OSI-approved open source license
        </a>
        .
      </>
    ),
  },
  {
    id: "useful",
    content:
      "You're building something genuinely useful that benefits from content and marketing.",
  },
  {
    id: "maintainer",
    content: "You're an owner or maintainer of the repository.",
  },
  {
    id: "active",
    content: "The project shows active development and community engagement.",
  },
] as const;

export default function OssProgramPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
      <section className="flex w-full items-center justify-center px-6 py-12 md:px-24 md:py-16">
        <div className="flex w-full max-w-[640px] flex-col items-center gap-4">
          <h1 className="text-balance text-center font-sans font-semibold text-4xl text-foreground leading-tight tracking-tight md:text-6xl">
            Notra for <span className="text-primary">open source</span>
          </h1>
          <p className="text-pretty text-center font-normal font-sans text-base text-muted-foreground leading-7">
            Notra is free for open source builders. Get the Pro plan at no cost
            in exchange for honest feedback, and let your shipped work do the
            marketing.
          </p>
        </div>
      </section>

      <section className="w-full border-border/70 border-t px-6 py-12 md:px-24 md:py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="font-sans font-semibold text-2xl text-foreground tracking-tight md:text-3xl">
              What you get
            </h2>
            <p className="max-w-2xl font-normal font-sans text-muted-foreground text-sm leading-6">
              Accepted projects use Notra free. The only ask is that you tell us
              what works and what doesn't.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <div
                className="flex flex-col gap-1.5 bg-card p-6"
                key={benefit.label}
              >
                <div className="flex items-center gap-2.5">
                  <HugeiconsIcon
                    className="size-4 text-primary"
                    icon={Tick02Icon}
                    strokeWidth={2.5}
                  />
                  <h3 className="font-medium font-sans text-base text-foreground">
                    {benefit.label}
                  </h3>
                </div>
                <p className="font-normal font-sans text-muted-foreground text-sm leading-6">
                  {benefit.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-border/70 border-t px-6 py-12 md:px-24 md:py-16">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <h2 className="font-sans font-semibold text-2xl text-foreground tracking-tight md:text-3xl">
            Who's eligible
          </h2>
          <ul className="flex flex-col gap-3">
            {ELIGIBILITY.map((item) => (
              <li className="flex items-start gap-3" key={item.id}>
                <HugeiconsIcon
                  className="mt-1 size-4 shrink-0 text-primary"
                  icon={Tick02Icon}
                  strokeWidth={2.5}
                />
                <span className="font-normal font-sans text-foreground text-sm leading-6">
                  {item.content}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="w-full border-border/70 border-t px-6 py-12 md:px-24 md:py-16">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-sans font-semibold text-2xl text-foreground tracking-tight md:text-3xl">
              Apply
            </h2>
            <p className="font-normal font-sans text-muted-foreground text-sm leading-6">
              Spots are limited. Tell us about your project and we'll be in
              touch by email.
            </p>
          </div>
          <OssApplicationForm />
        </div>
      </section>
    </div>
  );
}
