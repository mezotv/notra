import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ActivityFeed } from "@/components/activity-feed";
import BrandVoicePreview from "@/components/brand-voice-preview";
import { CtaBanner } from "@/components/landing/cta-banner";
import { MarketingHeroWash } from "@/components/marketing-hero-wash";
import ReferencesPreview from "@/components/references-preview";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/utils/jsonld";
import { PAGE_SOCIAL_IMAGES, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const IntegrationOrbit = dynamic(
  () => import("@/components/integration-orbit")
);

const CARD_SHELL_CLASS =
  "flex flex-col gap-6 overflow-clip rounded-[1.5rem] bg-[linear-gradient(in_oklab_180deg,oklab(95.1%_0.011_-0.018_/_15%)_0%,oklab(93.7%_0.019_-0.031_/_75%)_100%)] p-6 [box-shadow:#0A0D1408_0rem_0.0625rem_0.125rem,#0A0D1408_0rem_0.0625rem_0.125rem,#ECECEC_0rem_0rem_0rem_0.0625rem] sm:p-8 dark:bg-none dark:bg-white/[0.02] dark:[box-shadow:#0A0D1408_0rem_0.0625rem_0.125rem,#0A0D1408_0rem_0.0625rem_0.125rem,#FFFFFF14_0rem_0rem_0rem_0.0625rem]";

const title = "Features";
const description =
  "See how Notra turns shipped engineering work into changelogs, launch posts, and social updates that match your brand voice.";
const url = `${SITE_URL}/features`;

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
    images: [PAGE_SOCIAL_IMAGES.features],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [PAGE_SOCIAL_IMAGES.features.url],
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
};

const CORE_FEATURES = [
  {
    title: "One timeline of everything you shipped",
    description:
      "PRs, issues, and decisions from GitHub, Linear, and Slack land in one place, so nothing worth writing about slips through.",
    visual: "activity",
  },
  {
    title: "Drafts that don't sound like AI",
    description:
      "Notra learns your brand voice from your real posts and tweets. Every draft reads like your best writer wrote it.",
    visual: "brandVoice",
  },
  {
    title: "Set up in under a minute",
    description:
      "One click connects GitHub, Linear, and Slack. No pipelines, no prompts to engineer, no Zapier spaghetti.",
    visual: "integrations",
  },
  {
    title: "Train it on your best writing",
    description:
      "Drop in your tweets, launch posts, or blog snippets. Notra matches tone, cadence, and vocabulary. Yours, not ChatGPT's.",
    visual: "references",
  },
] as const;

const PUBLISHING_WORKFLOWS = [
  {
    title: "Auto-generate changelogs",
    description:
      "Every merged PR becomes a changelog entry. Kill the “what did we ship this week?” meeting.",
  },
  {
    title: "Draft launch posts from features",
    description:
      "Ship a feature, get a first-draft announcement waiting for you. Review, polish, publish.",
  },
  {
    title: "Social updates on autopilot",
    description:
      "Milestones and releases become short posts for X and LinkedIn. Stay visible without context-switching.",
  },
] as const;

const featuresJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: CORE_FEATURES.map((feature, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: feature.title,
    description: feature.description,
  })),
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", url: SITE_URL },
  { name: "Features", url },
]);

function FeatureVisual({
  kind,
}: {
  kind: (typeof CORE_FEATURES)[number]["visual"];
}) {
  if (kind === "activity") {
    return (
      <div className="relative flex w-full items-end justify-center overflow-hidden rounded-[1rem] border border-[#1E1E1E14] bg-background p-4 dark:border-white/10">
        <ActivityFeed />
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-linear-to-t from-background to-transparent" />
      </div>
    );
  }

  if (kind === "brandVoice") {
    return (
      <div className="w-full overflow-hidden rounded-[1rem] border border-[#1E1E1E14] bg-background px-4 dark:border-white/10">
        <BrandVoicePreview />
      </div>
    );
  }

  if (kind === "integrations") {
    return (
      <div className="relative flex h-50 w-full items-center justify-center overflow-hidden rounded-[1rem] border border-[#1E1E1E14] bg-background sm:h-62.5 md:h-75 dark:border-white/10">
        <IntegrationOrbit className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-[1rem] border border-[#1E1E1E14] bg-background px-4 dark:border-white/10">
      <ReferencesPreview />
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="flex w-full flex-col items-center gap-20 pb-20 antialiased [font-synthesis:none] lg:gap-28 lg:pb-28">
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(featuresJsonLd) }}
        type="application/ld+json"
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        type="application/ld+json"
      />

      <MarketingHeroWash
        subtitle="No new dashboards to babysit. Notra fits the workflow you already have."
        title={
          <>
            Built around how your team{" "}
            <span className="text-primary">actually ships</span>
          </>
        }
      />

      <section className="mx-auto flex w-full max-w-360 flex-col items-center px-6 lg:px-20">
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
          {CORE_FEATURES.map((feature) => (
            <div className={CARD_SHELL_CLASS} key={feature.title}>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-medium font-sans text-[#0A0D14] text-[1.375rem]/7 tracking-[-0.015em] sm:text-[1.5625rem]/8 dark:text-white">
                  {feature.title}
                </h3>
                <p className="font-medium font-sans text-[#6A6B70] text-base/6 dark:text-white/60">
                  {feature.description}
                </p>
              </div>
              <FeatureVisual kind={feature.visual} />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-360 flex-col items-center px-6 lg:px-20">
        <header className="flex flex-col items-center gap-4 pb-12 text-center md:pb-16">
          <h2 className="text-balance font-display font-medium text-[2rem] text-black leading-[1.15] tracking-[-0.02em] md:text-[2.75rem]/13 dark:text-white">
            Publishing workflows that{" "}
            <span className="text-primary">run themselves</span>
          </h2>
          <p className="max-w-206.25 text-balance font-display font-medium text-[#1E1E1EBF] text-xl/7.5 tracking-[-0.01em] dark:text-white/70">
            Pick the surfaces you care about. Notra keeps them filled.
          </p>
        </header>

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
          {PUBLISHING_WORKFLOWS.map((workflow) => (
            <div
              className="flex flex-col gap-2 rounded-[1.5rem] bg-[linear-gradient(in_oklab_180deg,oklab(95.1%_0.011_-0.018_/_15%)_0%,oklab(93.7%_0.019_-0.031_/_75%)_100%)] p-8 [box-shadow:#0A0D1408_0rem_0.0625rem_0.125rem,#0A0D1408_0rem_0.0625rem_0.125rem,#ECECEC_0rem_0rem_0rem_0.0625rem] dark:bg-none dark:bg-white/[0.02] dark:[box-shadow:#0A0D1408_0rem_0.0625rem_0.125rem,#0A0D1408_0rem_0.0625rem_0.125rem,#FFFFFF14_0rem_0rem_0rem_0.0625rem]"
              key={workflow.title}
            >
              <h3 className="font-medium font-sans text-[#0A0D14] text-[1.375rem]/7 tracking-[-0.015em] dark:text-white">
                {workflow.title}
              </h3>
              <p className="font-medium font-sans text-[#6A6B70] text-base/6 dark:text-white/60">
                {workflow.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full px-6 lg:px-20">
        <CtaBanner />
      </section>
    </div>
  );
}
