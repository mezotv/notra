import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ActivityFeed } from "@/components/activity-feed";
import BrandVoicePreview from "@/components/brand-voice-preview";
import ReferencesPreview from "@/components/references-preview";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/utils/jsonld";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const CTASection = dynamic(() => import("@/components/cta-section"));
const IntegrationOrbit = dynamic(
  () => import("@/components/integration-orbit")
);

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
      <div className="relative flex w-full items-end justify-center overflow-hidden rounded-lg pt-4">
        <ActivityFeed />
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-linear-to-t from-background to-transparent" />
      </div>
    );
  }

  if (kind === "brandVoice") {
    return (
      <div className="w-full pt-2">
        <BrandVoicePreview />
      </div>
    );
  }

  if (kind === "integrations") {
    return (
      <div className="relative flex h-50 w-full items-center justify-center overflow-hidden rounded-lg sm:h-62.5 md:h-75">
        <IntegrationOrbit className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="w-full pt-2">
      <ReferencesPreview />
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
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

      <section className="flex w-full flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-6 self-stretch border-border border-b px-6 py-12 md:px-24 md:py-16">
          <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4">
            <h1 className="self-stretch text-balance text-center font-sans font-semibold text-4xl text-foreground leading-tight tracking-tight md:text-6xl">
              Built around how your team{" "}
              <span className="text-primary">actually ships</span>
            </h1>
            <p className="self-stretch text-center font-normal font-sans text-base text-muted-foreground leading-7">
              No new dashboards to babysit. Notra fits the workflow you already
              have.
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 border-border border-b md:grid-cols-2">
          {CORE_FEATURES.map((feature, index) => {
            const isLastRowEven = index >= CORE_FEATURES.length - 2;
            const isLeftColumn = index % 2 === 0;
            return (
              <div
                className={`flex flex-col items-start justify-start gap-4 p-4 sm:gap-6 sm:p-6 md:p-8 lg:p-12 ${isLeftColumn ? "md:border-border md:border-r" : ""} ${isLastRowEven ? "" : "border-border border-b"}`}
                key={feature.title}
              >
                <div className="flex flex-col gap-2">
                  <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                    {feature.title}
                  </h3>
                  <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                    {feature.description}
                  </p>
                </div>
                <FeatureVisual kind={feature.visual} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex w-full flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-6 self-stretch border-border border-b px-6 py-12 md:px-24 md:py-16">
          <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4">
            <h2 className="self-stretch text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
              Publishing workflows that{" "}
              <span className="text-primary">run themselves</span>
            </h2>
            <p className="self-stretch text-center font-normal font-sans text-base text-muted-foreground leading-7">
              Pick the surfaces you care about. Notra keeps them filled.
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 border-border border-b md:grid-cols-3">
          {PUBLISHING_WORKFLOWS.map((workflow, index) => {
            const isLast = index === PUBLISHING_WORKFLOWS.length - 1;
            return (
              <div
                className={`flex flex-col items-start justify-start gap-3 p-6 sm:p-8 lg:p-10 ${isLast ? "" : "border-border border-b md:border-r md:border-b-0"}`}
                key={workflow.title}
              >
                <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                  {workflow.title}
                </h3>
                <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                  {workflow.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="w-full">
        <CTASection />
      </section>
    </div>
  );
}
