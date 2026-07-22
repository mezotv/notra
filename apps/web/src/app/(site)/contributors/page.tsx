import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { Github } from "@notra/ui/components/ui/svgs/github";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContributorsContent } from "@/components/contributors/contributors-content";
import { ContributorsPageSkeleton } from "@/components/contributors/skeleton";
import { MarketingHeroWash } from "@/components/marketing-hero-wash";
import { TrackedSignupLink } from "@/components/tracked-signup-link";
import { GITHUB_REPO_URL } from "@/utils/github";
import { TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

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
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
};

export default function ContributorsPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
      <MarketingHeroWash
        className="mb-12 md:mb-16"
        innerClassName="flex flex-col items-center gap-6 px-6 py-16 text-center md:px-24 md:py-24"
      >
        <div className="flex w-full max-w-[36.625rem] flex-col items-center gap-4">
          <h1 className="text-balance text-center font-display font-medium text-4xl text-[#1E1E1E] leading-[1.05] tracking-[-0.02em] md:text-6xl dark:text-white">
            Contributors & <span className="text-primary">Community</span>
          </h1>
          <p className="text-balance text-center font-medium font-sans text-[#1E1E1EBF] text-lg leading-7 dark:text-white/70">
            Meet the developers who build Notra and the sponsors who back it.
            Browse open issues, check in on pull requests, and jump in anytime.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <CtaButton
            nativeButton={false}
            render={<TrackedSignupLink source="contributors_cta" />}
            variant="primary"
          >
            Try Notra for free
          </CtaButton>
          <CtaButton
            nativeButton={false}
            render={
              <Link
                href={GITHUB_REPO_URL}
                rel="noopener noreferrer"
                target="_blank"
              />
            }
            variant="light"
          >
            <Github className="size-4" />
            View on GitHub
          </CtaButton>
        </div>
      </MarketingHeroWash>

      <Suspense fallback={<ContributorsPageSkeleton />}>
        <ContributorsContent />
      </Suspense>
    </div>
  );
}
