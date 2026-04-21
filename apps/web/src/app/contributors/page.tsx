import { Button } from "@notra/ui/components/ui/button";
import { Github } from "@notra/ui/components/ui/svgs/github";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContributorsContent } from "@/components/contributors/contributors-content";
import { ContributorsPageSkeleton } from "@/components/contributors/skeleton";
import { TrackedSignupLink } from "@/components/tracked-signup-link";
import { GITHUB_REPO_URL } from "@/utils/github";
import {
  DEFAULT_SOCIAL_IMAGE,
  SITE_URL,
  TWITTER_HANDLE,
} from "@/utils/metadata";

const title = "Contributors & Community";
const description =
  "Meet the developers who build Notra. Explore open issues, pull requests, and join our community.";
const url = `${SITE_URL}/contributors`;

export const revalidate = 3600;

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

export default function ContributorsPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
      <section className="flex w-full items-center justify-center px-6 py-12 md:px-24 md:py-16">
        <div className="flex w-full max-w-[586px] flex-col items-center gap-4">
          <h1 className="text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
            Contributors & <span className="text-primary">community</span>
          </h1>
          <p className="text-center font-normal font-sans text-base text-muted-foreground leading-7">
            Meet the developers who build Notra. Browse open issues, check in on
            pull requests, and jump in anytime.
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              className="h-10 overflow-hidden rounded-lg border-transparent bg-primary px-6 py-2 hover:bg-primary-hover"
              nativeButton={false}
              render={<TrackedSignupLink source="contributors_cta" />}
            >
              <span className="font-medium font-sans text-primary-foreground text-sm">
                Try Notra for free
              </span>
            </Button>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-5 font-medium font-sans text-foreground text-sm transition-colors hover:bg-muted"
              href={GITHUB_REPO_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Github className="size-4" />
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<ContributorsPageSkeleton />}>
        <ContributorsContent />
      </Suspense>
    </div>
  );
}
