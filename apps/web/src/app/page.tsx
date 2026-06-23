import { Button } from "@notra/ui/components/ui/button";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ActivityFeed } from "../components/activity-feed";
import BrandVoicePreview from "../components/brand-voice-preview";
import { HatchPattern } from "../components/hatch-pattern";
import ReferencesPreview from "../components/references-preview";
import TestimonialsSection from "../components/testimonials-section";
import { TrackedSignupLink } from "../components/tracked-signup-link";
import {
  NOTRA_CONTACT_EMAIL,
  NOTRA_SAME_AS,
  NOTRA_SUPPORT_EMAIL,
  siteUrl,
} from "../utils/agent-metadata";
import { SOCIAL_PROOF_LOGOS } from "../utils/constants";
import { serializeJsonLd } from "../utils/jsonld";
import { SITE_DESCRIPTION, SITE_TAGLINE, SITE_TITLE } from "../utils/metadata";
import { SITE_URL } from "../utils/urls";

const DocumentationSection = dynamic(
  () => import("../components/documentation-section")
);
const HowItWorksSection = dynamic(
  () => import("../components/how-it-works-section")
);
const FAQSection = dynamic(() => import("../components/faq-section"));
const CTASection = dynamic(() => import("../components/cta-section"));
const PricingCards = dynamic(() =>
  import("../components/pricing-section").then((mod) => ({
    default: mod.PricingCards,
  }))
);
const IntegrationOrbit = dynamic(
  () => import("../components/integration-orbit")
);

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Notra",
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: SITE_DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  creator: {
    "@type": "Organization",
    name: "Notra",
    url: SITE_URL,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Notra",
  url: SITE_URL,
  logo: siteUrl("/notra-mark.svg"),
  description: SITE_DESCRIPTION,
  sameAs: NOTRA_SAME_AS,
  contactPoint: [
    {
      "@type": "ContactPoint",
      email: NOTRA_CONTACT_EMAIL,
      contactType: "sales",
      availableLanguage: ["en"],
    },
    {
      "@type": "ContactPoint",
      email: NOTRA_SUPPORT_EMAIL,
      contactType: "customer support",
      availableLanguage: ["en"],
    },
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "US",
    addressRegion: "Delaware",
  },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Notra AI content generation",
  provider: organizationJsonLd,
  serviceType: "AI content-generation platform",
  areaServed: "Worldwide",
  description: SITE_DESCRIPTION,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Notra?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Notra is an AI content-generation platform that turns shipped work into changelogs, launch posts, marketing assets, and social updates in a team's brand voice.",
      },
    },
    {
      "@type": "Question",
      name: "How do AI agents integrate with Notra?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Agents can discover Notra through llms.txt, agent.json, the OpenAPI schema, auth.md, and the Notra MCP server.",
      },
    },
  ],
};

const speakableJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: SITE_TITLE,
  url: SITE_URL,
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: ["h1", "#agent-readable-summary"],
  },
};

function LandingPageJsonLd() {
  return (
    <>
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SSR'd JSON-LD payload, escaped via serializeJsonLd
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(softwareJsonLd) }}
        type="application/ld+json"
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SSR'd JSON-LD payload, escaped via serializeJsonLd
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(organizationJsonLd),
        }}
        type="application/ld+json"
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SSR'd JSON-LD payload, escaped via serializeJsonLd
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(serviceJsonLd) }}
        type="application/ld+json"
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SSR'd JSON-LD payload, escaped via serializeJsonLd
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
        type="application/ld+json"
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SSR'd JSON-LD payload, escaped via serializeJsonLd
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(speakableJsonLd) }}
        type="application/ld+json"
      />
    </>
  );
}

function LandingHero() {
  return (
    <>
      <div className="flex w-full max-w-234.25 flex-col items-center justify-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        <div className="flex flex-col items-center justify-center gap-4 self-stretch rounded-[3px] sm:gap-5 md:gap-6 lg:gap-8">
          <h1 className="flex w-full max-w-[46.8rem] flex-col justify-center text-pretty px-2 text-center font-normal font-serif text-[2rem] text-foreground leading-[1.1] sm:px-4 sm:text-[2.625rem] sm:leading-[1.15] md:px-0 md:text-[3.25rem] md:leading-[1.2] lg:text-[5rem] lg:leading-24">
            {SITE_TAGLINE}
          </h1>
          <div className="flex w-full max-w-[31.63rem] flex-col justify-center text-pretty px-2 text-center font-medium font-sans text-foreground/80 text-sm leading-[1.4] sm:px-4 sm:text-lg sm:leading-[1.45] md:px-0 md:text-xl md:leading-normal lg:text-lg lg:leading-7">
            {SITE_DESCRIPTION}
          </div>
          <p className="sr-only" id="agent-readable-summary">
            Notra is an AI content-generation platform for product and
            engineering teams. It turns shipped work from tools like GitHub into
            changelogs, launch posts, blog drafts, marketing assets, and social
            updates in the team's saved brand voice.
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-6 mb-16 flex w-full max-w-124.25 flex-col items-center justify-center gap-6 sm:mt-8 sm:mb-0 sm:gap-8 md:mt-10 md:gap-10 lg:mt-12 lg:gap-12">
        <div className="flex items-center justify-start gap-3 backdrop-blur-[0.515625rem] sm:gap-4">
          <TrackedSignupLink source="landing_page_hero_cta">
            <Button className="corner-squircle h-10 overflow-hidden rounded-[1rem] border-transparent bg-primary px-6 py-2 shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] hover:bg-primary-hover supports-[corner-shape:round]:rounded-[1.25rem] sm:h-11 sm:px-8 sm:py-1.5 md:h-12 md:px-10 lg:px-12">
              <span className="flex flex-col justify-center font-medium font-sans text-primary-foreground text-sm leading-5 sm:text-base md:text-[0.9375rem]">
                Start for free
              </span>
            </Button>
          </TrackedSignupLink>
          <Button
            className="corner-squircle h-10 overflow-hidden rounded-[1rem] px-6 py-2 supports-[corner-shape:round]:rounded-[1.25rem] sm:h-11 sm:px-8 sm:py-1.5 md:h-12 md:px-10 lg:px-12"
            nativeButton={false}
            render={<Link href="#how-it-works" />}
            variant="outline"
          >
            <span className="flex flex-col justify-center font-medium font-sans text-foreground text-sm leading-5 sm:text-base md:text-[0.9375rem]">
              How it works
            </span>
          </Button>
        </div>
      </div>

      <div className="mt-8 hidden items-stretch justify-center self-stretch border-border border-y sm:mt-10 md:mt-12 md:flex lg:mt-14">
        <HatchPattern className="w-4 sm:w-6 md:w-8 lg:w-12" />

        <div className="relative z-5 flex flex-1 flex-col">
          <div className="flex aspect-video w-full flex-col items-start justify-start overflow-hidden rounded-md bg-card shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] sm:rounded-lg lg:rounded-[0.566rem]">
            <Image
              alt="Notra product demo"
              className="h-full w-full object-cover dark:hidden"
              height={1080}
              priority
              sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 768px) calc(100vw - 3rem), (max-width: 1024px) calc(100vw - 4rem), calc(100vw - 6rem)"
              src="/demo.webp"
              width={1920}
            />
            <Image
              alt="Notra product demo"
              className="hidden h-full w-full object-cover dark:block"
              height={1080}
              priority
              sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 768px) calc(100vw - 3rem), (max-width: 1024px) calc(100vw - 4rem), calc(100vw - 6rem)"
              src="/demo-dark.webp"
              width={1920}
            />
          </div>
        </div>

        <HatchPattern className="w-4 sm:w-6 md:w-8 lg:w-12" />
      </div>
    </>
  );
}

export default function LandingPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b">
      <LandingPageJsonLd />
      <main className="flex w-full flex-col items-center justify-start pt-28 sm:pt-20 md:pt-24 lg:pt-36">
        <LandingHero />

        <section
          className="flex w-full flex-col items-center justify-center border-border border-b content-defer"
          id="social-proof"
        >
          <div className="flex items-center justify-center gap-6 self-stretch border-border border-b px-4 py-8 sm:px-6 sm:py-12 md:px-24 md:py-16">
            <div className="flex w-full max-w-146.5 flex-col items-center justify-start gap-3 sm:gap-4">
              <h2 className="w-full max-w-[29.53rem] text-balance text-center font-sans font-semibold text-foreground text-xl leading-tight tracking-tight sm:text-2xl md:text-3xl md:leading-15 lg:text-5xl">
                Fast-moving teams trust Notra to{" "}
                <span className="text-primary">tell their story</span>
              </h2>
              <div className="self-stretch text-balance text-center font-normal font-sans text-muted-foreground text-sm leading-6 sm:text-base sm:leading-7">
                Startups use Notra to turn every shipped feature{" "}
                <br className="hidden sm:block" />
                into a changelog, post, or update, without hiring a writer.
              </div>
            </div>
          </div>

          <div className="flex items-start justify-center self-stretch md:hidden">
            <HatchPattern className="w-4 self-stretch" spacing={12} />

            <div className="flex flex-1 flex-col border-border border-r border-l">
              {SOCIAL_PROOF_LOGOS.map((logo, index) => (
                <a
                  className={`flex h-24 items-center justify-center gap-2.5 transition-opacity hover:opacity-80 ${
                    index < SOCIAL_PROOF_LOGOS.length - 1
                      ? "border-border border-b"
                      : ""
                  }`}
                  href={logo.href}
                  key={logo.name}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <logo.Component
                    className={`w-auto ${logo.className ?? "h-8"}`}
                  />
                </a>
              ))}
            </div>

            <HatchPattern className="w-4 self-stretch" spacing={12} />
          </div>

          <div className="hidden items-start justify-center self-stretch md:flex">
            <HatchPattern className="w-6 self-stretch md:w-8 lg:w-12" />

            <div className="flex flex-1 flex-wrap border-border border-r border-l">
              {SOCIAL_PROOF_LOGOS.map((logo, index) => (
                <a
                  className={`flex h-32 items-center justify-center gap-2 transition-opacity hover:opacity-80 md:h-36 lg:h-40 ${
                    index < SOCIAL_PROOF_LOGOS.length - 1
                      ? "border-border border-r-[0.5px]"
                      : ""
                  }`}
                  href={logo.href}
                  key={logo.name}
                  rel="noopener noreferrer"
                  style={{
                    flexBasis: `${100 / Math.min(SOCIAL_PROOF_LOGOS.length, 4)}%`,
                  }}
                  target="_blank"
                >
                  <logo.Component className="h-6 w-auto md:h-7" />
                </a>
              ))}
            </div>

            <HatchPattern className="w-6 self-stretch md:w-8 lg:w-12" />
          </div>
        </section>

        <section
          className="flex w-full flex-col items-center justify-center border-border border-b content-defer"
          id="features"
        >
          <div className="flex items-center justify-center gap-6 self-stretch border-border border-b px-6 py-12 md:px-24 md:py-16">
            <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4">
              <h2 className="self-stretch text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
                Your team ships. Notra{" "}
                <span className="text-primary">tells the story</span>
              </h2>
              <div className="self-stretch text-center font-normal font-sans text-base text-muted-foreground leading-7">
                Notra quietly watches GitHub, Linear, and Slack, then drafts
                <br />
                changelogs, posts, and announcements in your brand voice.
              </div>
            </div>
          </div>

          <div className="flex items-start justify-center self-stretch">
            <HatchPattern className="w-4 self-stretch sm:w-6 md:w-8 lg:w-12" />

            <div className="grid flex-1 grid-cols-1 gap-0 border-border border-r border-l md:grid-cols-2">
              <div className="flex flex-col items-start justify-start gap-4 border-border border-r-0 border-b p-4 sm:gap-6 sm:p-6 md:border-r md:p-8 lg:p-12">
                <div className="flex flex-col gap-2">
                  <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                    One timeline of everything you shipped
                  </h3>
                  <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                    PRs, issues, and decisions from GitHub, Linear, and Slack in
                    one place, so nothing worth writing about slips through.
                  </p>
                </div>
                <div className="relative flex w-full items-end justify-center overflow-hidden rounded-lg pt-4">
                  <ActivityFeed />
                  <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-linear-to-t from-background to-transparent" />
                </div>
              </div>

              <div className="flex flex-col items-start justify-start gap-4 border-border border-b p-4 sm:gap-6 sm:p-6 md:p-8 lg:p-12">
                <div className="flex flex-col gap-2">
                  <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                    Drafts that don't sound like AI
                  </h3>
                  <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                    Notra learns your brand voice from your real posts and
                    tweets. Every draft reads like your best writer wrote it.
                  </p>
                </div>
                <div className="w-full pt-2">
                  <BrandVoicePreview />
                </div>
              </div>

              <div className="flex flex-col items-start justify-start gap-4 border-border border-r-0 bg-transparent p-4 sm:gap-6 sm:p-6 md:border-r md:p-8 lg:p-12">
                <div className="flex flex-col gap-2">
                  <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                    Set up in under a minute
                  </h3>
                  <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                    One click connects GitHub, Linear, and Slack. No pipelines,
                    no prompts to engineer, no Zapier spaghetti.
                  </p>
                </div>
                <div className="relative flex h-50 w-full items-center justify-center overflow-hidden rounded-lg sm:h-62.5 md:h-75">
                  <IntegrationOrbit className="h-full w-full" />
                </div>
              </div>

              <div className="flex flex-col items-start justify-start gap-4 p-4 sm:gap-6 sm:p-6 md:p-8 lg:p-12">
                <div className="flex flex-col gap-2">
                  <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                    Train it on your best writing
                  </h3>
                  <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                    Drop in your tweets, launch posts, or blog snippets. Notra
                    matches tone, cadence, and vocabulary. Yours, not ChatGPT's.
                  </p>
                </div>
                <div className="w-full pt-2">
                  <ReferencesPreview />
                </div>
              </div>
            </div>

            <HatchPattern className="w-4 self-stretch sm:w-6 md:w-8 lg:w-12" />
          </div>
        </section>

        <section className="w-full content-defer" id="how-it-works">
          <HowItWorksSection />
        </section>

        <section className="w-full content-defer" id="documentation">
          <DocumentationSection />
        </section>

        <section className="w-full content-defer" id="testimonials">
          <TestimonialsSection />
        </section>

        <section className="w-full content-defer" id="pricing">
          <div className="flex w-full flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-6 self-stretch px-6 py-12 md:px-24 md:py-16">
              <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4">
                <h2 className="self-stretch text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
                  Pricing that grows with{" "}
                  <span className="text-primary">your team</span>
                </h2>

                <div className="self-stretch text-center font-normal font-sans text-base text-muted-foreground leading-7">
                  Start with a 3-day free trial. Upgrade when you
                  <br />
                  need more integrations, posts, or team seats.
                </div>
              </div>
            </div>

            <PricingCards />
          </div>
        </section>

        <section className="w-full content-defer" id="faq">
          <FAQSection />
        </section>

        <section className="w-full content-defer" id="cta">
          <CTASection />
        </section>
      </main>
    </div>
  );
}
