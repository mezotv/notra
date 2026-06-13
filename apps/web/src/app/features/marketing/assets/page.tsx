import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { LoopVideo } from "@/components/marketing-assets/loop-video";
import { ASSET_SHOWCASE_SECTIONS } from "@/lib/marketing-assets/constants";
import {
  getAssetShowcaseDescription,
  getAssetShowcaseTitle,
} from "@/lib/marketing-assets/utils";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/utils/jsonld";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const CTASection = dynamic(() => import("@/components/cta-section"));

const title = "Marketing Assets";
const description =
  "Notra turns merged PRs into launch visuals in your brand. Real layers, real text, ready to paste into Paper or Figma.";
const url = `${SITE_URL}/features/marketing/assets`;

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

const assetsJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: ASSET_SHOWCASE_SECTIONS.map((section, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: getAssetShowcaseTitle(section),
    description: getAssetShowcaseDescription(section),
  })),
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", url: SITE_URL },
  { name: "Features", url: `${SITE_URL}/features` },
  { name: "Marketing Assets", url },
]);

export default function MarketingAssetsPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(assetsJsonLd) }}
        type="application/ld+json"
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        type="application/ld+json"
      />

      {ASSET_SHOWCASE_SECTIONS.map((section, index) => {
        const Heading = index === 0 ? "h1" : "h2";
        return (
          <section className="w-full border-border border-b" key={section.id}>
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 py-12 md:px-12 md:py-20 lg:grid-cols-[2fr_3fr] lg:gap-16 lg:px-16">
              <div
                className={`flex flex-col gap-6 ${section.mediaSide === "left" ? "lg:order-2" : ""}`}
              >
                <Heading className="text-balance font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl">
                  {section.headingPre}
                  <span className="text-primary">{section.headingAccent}</span>
                  {section.headingPost}
                </Heading>
                <div className="flex flex-col gap-4">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      className="font-normal font-sans text-base text-muted-foreground leading-7"
                      key={paragraph}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              <div className={section.mediaSide === "left" ? "lg:order-1" : ""}>
                <LoopVideo
                  label={section.videoLabel}
                  poster={section.posterSrc}
                  src={section.videoSrc}
                />
              </div>
            </div>
          </section>
        );
      })}

      <section className="w-full">
        <CTASection />
      </section>
    </div>
  );
}
