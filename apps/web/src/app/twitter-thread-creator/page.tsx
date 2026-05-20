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
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-16 sm:pt-20 md:pt-24">
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

      <section className="flex w-full flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-6 self-stretch border-border border-b px-6 py-8 sm:py-10 md:px-24 md:py-12">
          <div className="flex w-full max-w-[42rem] flex-col items-center justify-start gap-3">
            <h1 className="self-stretch text-balance text-center font-normal font-serif text-2xl text-foreground leading-tight tracking-tight sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              X <span className="text-primary">(Twitter)</span> Threads Creator
            </h1>
            <p className="self-stretch text-balance text-center font-normal font-sans text-muted-foreground text-sm leading-6 sm:text-base sm:leading-7">
              Write, reorder, and preview your thread in one place. Free, no
              sign-up.
            </p>
          </div>
        </div>

        <div className="flex w-full items-start justify-center self-stretch px-4 py-8 sm:px-6 sm:py-10 md:px-12 md:py-12 lg:px-24">
          <div className="w-full max-w-6xl">
            <ThreadBuilder />
          </div>
        </div>
      </section>
    </div>
  );
}
