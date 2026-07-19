import { Button } from "@notra/ui/components/ui/button";
import type { Metadata } from "next";
import { BrandAssetCard } from "@/components/brand-asset-card";
import { BrandColorSwatch } from "@/components/brand-color-swatch";
import { NotraMark } from "@/components/notra-mark";
import {
  BRAND_ASSETS,
  BRAND_COLORS,
  BRAND_FONTS,
  FONT_SAMPLE,
} from "@/lib/brand/constants";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/utils/jsonld";
import { PAGE_SOCIAL_IMAGES, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const title = "Brand Guidelines";
const description =
  "Official assets and guidelines to help you reference the Notra brand, including our logo, colors and typography.";
const url = `${SITE_URL}/brand`;

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", url: SITE_URL },
  { name: "Brand", url },
]);

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
    images: [PAGE_SOCIAL_IMAGES.brand],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [PAGE_SOCIAL_IMAGES.brand.url],
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
};

export default function BrandPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        type="application/ld+json"
      />

      <div className="w-full max-w-5xl px-6 pt-4 pb-12 md:pb-16">
        <div className="flex w-full flex-col items-start gap-4">
          <h1 className="text-balance font-sans font-semibold text-4xl text-foreground leading-tight tracking-tight md:text-6xl">
            Brand <span className="text-primary">Guidelines</span>
          </h1>
          <div className="max-w-146.5 text-balance font-sans text-base text-muted-foreground leading-7">
            Official assets and guidelines to help you reference the Notra
            brand, including our logo, colors and typography.
          </div>
          <Button
            className="corner-squircle h-10 overflow-hidden rounded-[1rem] border-transparent bg-primary px-6 py-2 shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] hover:bg-primary-hover supports-[corner-shape:round]:rounded-[1.25rem] sm:h-11 sm:px-8 sm:py-1.5 md:h-12 md:px-10 lg:px-12"
            nativeButton={false}
            render={
              <a download href={BRAND_ASSETS.zip}>
                <span className="flex flex-col justify-center font-medium font-sans text-primary-foreground text-sm leading-5 sm:text-base md:text-[0.9375rem]">
                  Download brand assets
                </span>
              </a>
            }
          />
        </div>
      </div>

      <div className="flex w-full max-w-5xl flex-col gap-16 px-6 pb-20 md:pb-24">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-2xl text-foreground tracking-tight">
              Logo
            </h2>
            <p className="text-muted-foreground text-sm leading-6">
              The Notra mark. Keep it on a light surface and give it room to
              breathe. Hover a card to download the logo as SVG or PNG.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <BrandAssetCard
              asset={BRAND_ASSETS.mark}
              copyLabel="Copy logo as SVG"
              downloadName="notra-mark"
              variant="light"
            >
              <NotraMark className="size-20 shrink-0" />
            </BrandAssetCard>
            <BrandAssetCard
              asset={BRAND_ASSETS.mark}
              copyLabel="Copy logo as SVG"
              downloadName="notra-mark"
              variant="dark"
            >
              <span className="flex size-24 items-center justify-center rounded-2xl bg-[#F6F3F1]">
                <NotraMark className="size-14 shrink-0" />
              </span>
            </BrandAssetCard>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-2xl text-foreground tracking-tight">
              Wordmark
            </h2>
            <p className="text-muted-foreground text-sm leading-6">
              The mark paired with the Notra name set in Inter Semibold. On dark
              surfaces, place the mark on a cream tile. Hover a card to download
              the wordmark as SVG or PNG.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <BrandAssetCard
              asset={BRAND_ASSETS.wordmark}
              copyLabel="Copy wordmark as SVG"
              downloadName="notra-wordmark"
              variant="light"
            >
              <span className="flex items-center gap-3">
                <NotraMark className="size-10 shrink-0" />
                <span className="font-semibold text-3xl text-neutral-950">
                  Notra
                </span>
              </span>
            </BrandAssetCard>
            <BrandAssetCard
              asset={BRAND_ASSETS.wordmarkDark}
              copyLabel="Copy wordmark as SVG"
              downloadName="notra-wordmark-dark"
              variant="dark"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-14 items-center justify-center rounded-xl bg-[#F6F3F1]">
                  <NotraMark className="size-10 shrink-0" />
                </span>
                <span className="font-semibold text-3xl text-white">Notra</span>
              </span>
            </BrandAssetCard>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-2xl text-foreground tracking-tight">
              Colors
            </h2>
            <p className="text-muted-foreground text-sm leading-6">
              Our palette pairs a violet primary with the lavender, ink, and
              cream of the mark. Click a swatch to copy its hex value.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {BRAND_COLORS.map((color) => (
              <BrandColorSwatch color={color} key={color.name} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-2xl text-foreground tracking-tight">
              Typography
            </h2>
            <p className="text-muted-foreground text-sm leading-6">
              Inter carries the product and the site. Instrument Serif adds
              editorial accents. Both are free on Google Fonts.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {BRAND_FONTS.map((font) => (
              <div
                className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background p-6"
                key={font.name}
              >
                <span
                  className={`${font.fontClassName} text-6xl text-foreground`}
                >
                  Aa
                </span>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground text-sm">
                    {font.name}
                  </span>
                  <span className="text-muted-foreground text-xs leading-5">
                    {font.role}
                  </span>
                </div>
                <p
                  className={`${font.fontClassName} text-foreground/80 text-lg leading-7`}
                >
                  {FONT_SAMPLE}
                </p>
                <a
                  className="text-primary text-sm underline-offset-4 hover:underline"
                  href={font.googleFontsUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Get {font.name} on Google Fonts
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
