import type { Metadata } from "next";
import ThreadBuilder from "@/components/threads/thread-builder";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/utils/jsonld";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const title = "X Thread Builder";
const description =
  "Draft, reorder, and ship X (Twitter) threads in a clean, distraction-free workspace. Free, no sign-up.";
const url = `${SITE_URL}/twitter-thread-creator`;

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

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", url: SITE_URL },
  { name: "X Thread Builder", url },
]);

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "X Thread Builder",
  url,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function ThreadsPage() {
  return (
    <div className="flex w-full flex-col items-center pt-16 sm:pt-20 md:pt-24">
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        type="application/ld+json"
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(softwareJsonLd) }}
        type="application/ld+json"
      />

      <section className="flex w-full flex-col items-center gap-10 pb-16 antialiased [font-synthesis:none] md:gap-12 md:pb-24">
        <header className="flex w-full max-w-[42rem] flex-col items-center gap-4 px-6 text-center">
          <h1 className="text-balance font-display font-medium text-[#1E1E1E] text-[2rem] leading-[1.1] tracking-[-0.02em] sm:text-[2.75rem] lg:text-[3.25rem] dark:text-white">
            X (Twitter) <span className="text-primary">Threads</span> Creator
          </h1>
          <p className="text-balance font-medium font-sans text-[#1E1E1EBF] text-base leading-7 sm:text-lg dark:text-white/70">
            Write, reorder, and preview your thread in one place. Free, no
            sign-up.
          </p>
        </header>

        <div className="w-full max-w-3xl px-4 sm:px-6">
          <div className="rounded-3xl border border-[#1E1E1E14] bg-[linear-gradient(in_oklab_180deg,oklab(95.1%_0.011_-0.018_/_15%)_0%,oklab(93.7%_0.019_-0.031_/_75%)_100%)] p-2 sm:p-4 dark:border-white/10 dark:bg-none dark:bg-white/[0.02]">
            <div className="rounded-2xl border border-[#1E1E1E0D] bg-background p-1 sm:p-2 dark:border-white/5">
              <ThreadBuilder />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
