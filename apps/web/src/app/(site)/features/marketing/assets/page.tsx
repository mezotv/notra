import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Figma } from "@notra/ui/components/ui/svgs/figma";
import { Paper } from "@notra/ui/components/ui/svgs/paper";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { HeroVideoCarousel } from "@/components/marketing-assets/hero-video-carousel";
import { LoopVideo } from "@/components/marketing-assets/loop-video";
import { TrackedSignupLink } from "@/components/tracked-signup-link";
import { ASSET_HERO } from "@/lib/marketing-assets/constants/hero";
import { ASSET_SHOWCASE_SECTIONS } from "@/lib/marketing-assets/constants/showcase";
import {
  getAssetShowcaseDescription,
  getAssetShowcaseTitle,
} from "@/lib/marketing-assets/utils/showcase";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/utils/jsonld";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const CTASection = dynamic(() => import("@/components/cta-section"));

const title = "Marketing Assets";
const description =
  "Notra turns merged PRs into marketing visuals in your brand. Real layers, real text, ready to paste into Paper or Figma.";
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

function PasteReadyLogos() {
  return (
    <div className="flex flex-wrap items-center gap-2 font-sans text-muted-foreground text-sm">
      <span>Paste-ready for</span>
      <span className="inline-flex h-8 items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 text-foreground">
        <Paper aria-hidden="true" className="size-4" />
        Paper
      </span>
      <span>or</span>
      <span className="inline-flex h-8 items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 text-foreground">
        <Figma aria-hidden="true" className="h-4 w-3" />
        Figma
      </span>
    </div>
  );
}

export default function MarketingAssetsPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b">
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

      <section className="w-full border-border border-b pt-14 sm:pt-16 lg:pt-18">
        <div className="-translate-y-6 md:-translate-y-10 lg:-translate-y-20 mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 py-8 md:px-12 md:py-10 lg:grid-cols-[9fr_11fr] lg:gap-16 lg:px-16 lg:py-12">
          <div className="flex flex-col items-start gap-7">
            <div className="flex flex-col gap-5">
              <h1 className="max-w-3xl text-balance font-sans font-semibold text-4xl text-foreground leading-tight tracking-tight md:text-5xl lg:text-6xl">
                {ASSET_HERO.title}
                <span className="text-primary"> {ASSET_HERO.accent}</span>
              </h1>
              <p className="max-w-2xl font-normal font-sans text-lg text-muted-foreground leading-8">
                {ASSET_HERO.description}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <TrackedSignupLink source="marketing_assets_hero_cta">
                <Button className="corner-squircle h-12 rounded-[1rem] px-8 supports-[corner-shape:round]:rounded-[1.25rem]">
                  <span className="flex items-center gap-2 font-medium font-sans text-base">
                    {ASSET_HERO.primaryCta}
                    <HugeiconsIcon className="size-4" icon={ArrowRight02Icon} />
                  </span>
                </Button>
              </TrackedSignupLink>
              <Button
                className="corner-squircle h-12 rounded-[1rem] px-8 supports-[corner-shape:round]:rounded-[1.25rem]"
                nativeButton={false}
                render={<Link href="#generate" />}
                variant="outline"
              >
                <span className="font-medium font-sans text-base">
                  {ASSET_HERO.secondaryCta}
                </span>
              </Button>
            </div>
          </div>

          <div className="relative">
            <HeroVideoCarousel videos={ASSET_HERO.videos} />
          </div>
        </div>
      </section>

      {ASSET_SHOWCASE_SECTIONS.map((section) => {
        const Heading = "h2";
        return (
          <section
            className="w-full scroll-mt-24 border-border border-b"
            id={section.id}
            key={section.id}
          >
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
                {section.id === "generate" ? <PasteReadyLogos /> : null}
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
