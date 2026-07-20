import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import StarVideoTool from "@/components/star-video/star-video-tool";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/utils/jsonld";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const title = "Repo Star Video";
const description =
  "Turn any GitHub repository into a celebratory star-count video, with real stargazer avatars and confetti. Free, no sign-up.";
const url = `${SITE_URL}/repo-star-video`;

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
  { name: "Repo Star Video", url },
]);

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Repo Star Video",
  url,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RepoStarVideoPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
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
              Repo <span className="text-primary">Star</span> Video
            </h1>
            <p className="self-stretch text-balance text-center font-normal font-sans text-muted-foreground text-sm leading-6 sm:text-base sm:leading-7">
              Celebrate your GitHub stars with an animated video featuring real
              stargazer avatars and confetti. Free, no sign-up.
            </p>
          </div>
        </div>

        <div className="flex w-full items-start justify-center self-stretch px-4 py-8 sm:px-6 sm:py-10 md:px-12 md:py-12 lg:px-24">
          <div className="w-full max-w-4xl">
            <NuqsAdapter>
              <StarVideoTool />
            </NuqsAdapter>
          </div>
        </div>
      </section>
    </div>
  );
}
