import type { Metadata } from "next";
import TermsContent from "@/content/legal/terms.mdx";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const title = "Terms of Service";
const description =
  "Terms of Service for using Notra, the content automation platform.";
const url = `${SITE_URL}/terms`;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url,
  },
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

export default function TermsPage() {
  return (
    <>
      <header className="not-prose mb-10 border-[#1E1E1E1A] border-b pb-8 dark:border-white/10">
        <h1 className="font-display font-medium text-4xl text-[#1E1E1E] leading-[1.1] tracking-[-0.02em] sm:text-5xl dark:text-white">
          Terms of <span className="text-primary">Service</span>
        </h1>
        <p className="mt-4 font-sans text-[#1E1E1EBF] text-base leading-7 dark:text-white/70">
          The terms that govern your use of Notra, the content automation
          platform.
        </p>
      </header>
      <TermsContent />
    </>
  );
}
