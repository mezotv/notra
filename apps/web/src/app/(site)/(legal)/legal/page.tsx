import type { Metadata } from "next";
import LegalContent from "@/content/legal/legal.mdx";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const title = "Legal Notice";
const description =
  "Legal notice and imprint for Notra in accordance with German Telemedia Act (TMG).";
const url = `${SITE_URL}/legal`;

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

export default function LegalPage() {
  return (
    <>
      <header className="not-prose mb-10 border-[#1E1E1E1A] border-b pb-8 dark:border-white/10">
        <h1 className="font-display font-medium text-4xl text-[#1E1E1E] leading-[1.1] tracking-[-0.02em] sm:text-5xl dark:text-white">
          Legal <span className="text-primary">Notice</span>
        </h1>
        <p className="mt-4 font-sans text-[#1E1E1EBF] text-base leading-7 dark:text-white/70">
          Company details and imprint information for Notra, provided in
          accordance with the German Telemedia Act (TMG).
        </p>
      </header>
      <LegalContent />
    </>
  );
}
