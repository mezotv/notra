import {
  ANSWER_EXAMPLE_HEADING,
  ANSWER_EXAMPLE_SUBCOPY,
} from "@/constants/landing/answer-example";
import {
  CTA_BANNER_HEADING,
  CTA_BANNER_SUBCOPY,
} from "@/constants/landing/cta-banner";
import { FAQ_CONTENT } from "@/constants/landing/faq";
import {
  FEATURES_ENGINES_COPY,
  FEATURES_GAPS_COPY,
  FEATURES_HEADING,
  FEATURES_SHARE_COPY,
  FEATURES_SUBCOPY_LINE_ONE,
  FEATURES_SUBCOPY_LINE_TWO,
  FEATURES_TRAFFIC_COPY,
} from "@/constants/landing/features";
import { GEO_ENGINE_NAMES } from "@/constants/landing/geo-engines";
import {
  HERO_HEADLINE_CYCLE,
  HERO_HEADLINE_LINE_ONE,
  HERO_HEADLINE_LINE_TWO_PREFIX,
  HERO_HEADLINE_SUFFIX,
  HERO_SUBHEAD,
} from "@/constants/landing/hero";
import { MARQUEE_CAPTION } from "@/constants/landing/marquee-quote";
import {
  PRICING_HEADING,
  PRICING_SUBHEADING,
} from "@/constants/landing/pricing";
import { BRAND_ASSETS, BRAND_COLORS, BRAND_FONTS } from "@/lib/brand/constants";
import {
  COMPARISON_FEATURES,
  PRICING_PLANS,
  SOCIAL_PROOF_LOGOS,
} from "@/utils/constants";
import { markdownSection } from "@/utils/markdown";
import { SITE_DESCRIPTION, SITE_TAGLINE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

function renderPlanPrice(
  plan: (typeof PRICING_PLANS)[keyof typeof PRICING_PLANS]
) {
  if (plan.name === "Enterprise") {
    return "Contact us";
  }

  return `$${plan.pricing.monthly}/month`;
}

function renderPlanFeatures(
  plan: (typeof PRICING_PLANS)[keyof typeof PRICING_PLANS]
) {
  return plan.features.map((feature) => {
    if (typeof feature === "string") {
      return `- ${feature}`;
    }

    return `- ${feature.label} (${feature.subtitle})`;
  });
}

function renderComparisonValue(value: boolean | string): string {
  if (typeof value !== "boolean") {
    return value;
  }

  return value ? "Yes" : "No";
}

export function buildFeaturesMarkdown() {
  return [
    "# Features",
    "",
    "Notra watches your team's activity in the background and drafts content that matches your brand voice.",
    "",
    markdownSection("Core Features", [
      "### Your work, automatically organized",
      "Every PR, issue, and conversation lands in one organized timeline your whole team can read.",
      "",
      "### Brand voice matching",
      "Notra learns your tone and style so every draft sounds like your team wrote it.",
      "",
      "### One-click integrations",
      "GitHub, Linear, Slack, and more plug in with a single click. You will be connected in under a minute.",
      "",
      "### More to come",
      "We are building new features every week.",
    ]),
    markdownSection("Publishing Workflows", [
      "### Auto-generate changelogs",
      "Every merged PR becomes a changelog entry. No more manual release notes.",
      "",
      "### Draft blog posts from features",
      "Ship a feature and Notra writes the first draft of the announcement post.",
      "",
      "### Social updates from milestones",
      "Releases and milestones become short social posts you can review, tweak, and publish.",
    ]),
    markdownSection("Next Steps", [
      "- [Pricing](https://www.usenotra.com/pricing.md)",
      "- [Blog](https://www.usenotra.com/blog.md)",
      "- [Changelog examples](https://www.usenotra.com/changelog.md)",
      "- [Start for free](https://app.usenotra.com/signup)",
    ]),
  ].join("\n");
}

export function buildPricingMarkdown() {
  const planSections = Object.values(PRICING_PLANS)
    .map((plan) =>
      [
        `## ${plan.name}`,
        "",
        plan.description,
        "",
        `Price: ${renderPlanPrice(plan)}`,
        `CTA: [${plan.cta.label}](${plan.cta.href})`,
        "",
        ...renderPlanFeatures(plan),
        "",
      ].join("\n")
    )
    .join("\n");

  const comparisonSections = COMPARISON_FEATURES.map(({ category, features }) =>
    markdownSection(
      category,
      features.map((feature) => {
        const starter = renderComparisonValue(feature.starter);
        const growth = renderComparisonValue(feature.growth);
        const scale = renderComparisonValue(feature.scale);
        const enterprise = renderComparisonValue(feature.enterprise);

        return `- ${feature.name}: Starter ${starter}, Growth ${growth}, Scale ${scale}, Enterprise ${enterprise}`;
      })
    )
  ).join("\n");

  return [
    "# Pricing",
    "",
    "Choose the right Notra plan for your team.",
    "",
    "Upgrade when you need more images, posts, or projects.",
    "",
    planSections,
    "## Feature Comparison",
    "",
    comparisonSections,
  ].join("\n");
}

function listEngines(): string {
  const names = HERO_HEADLINE_CYCLE.map(
    (word) => GEO_ENGINE_NAMES[word.engine]
  );
  const last = names.at(-1);
  if (names.length < 2 || !last) {
    return names.join("");
  }
  return `${names.slice(0, -1).join(", ")} or ${last}`;
}

export function buildLandingMarkdown() {
  const socialProofLines = SOCIAL_PROOF_LOGOS.map(
    (logo) => `- [${logo.name}](${logo.href})`
  );
  const headline = `${HERO_HEADLINE_LINE_ONE} ${HERO_HEADLINE_LINE_TWO_PREFIX} ${listEngines()}${HERO_HEADLINE_SUFFIX}`;

  return [
    "# Notra",
    "",
    SITE_TAGLINE,
    "",
    `## ${headline}`,
    "",
    HERO_SUBHEAD,
    "",
    SITE_DESCRIPTION,
    "",
    "Primary CTA: [Start for free](https://app.usenotra.com/signup)",
    "",
    markdownSection("Explore in Markdown", [
      "- [Features](https://www.usenotra.com/features.md)",
      "- [Pricing](https://www.usenotra.com/pricing.md)",
      "- [Blog](https://www.usenotra.com/blog.md)",
      "- [Changelog](https://www.usenotra.com/changelog.md)",
    ]),
    markdownSection("Social Proof", [MARQUEE_CAPTION, "", ...socialProofLines]),
    markdownSection(FEATURES_HEADING, [
      FEATURES_SUBCOPY_LINE_ONE,
      FEATURES_SUBCOPY_LINE_TWO,
      "",
      `### ${FEATURES_ENGINES_COPY.title}`,
      FEATURES_ENGINES_COPY.description,
      "",
      `### ${FEATURES_SHARE_COPY.title}`,
      FEATURES_SHARE_COPY.description,
      "",
      `### ${FEATURES_TRAFFIC_COPY.title}`,
      FEATURES_TRAFFIC_COPY.description,
      "",
      `### ${FEATURES_GAPS_COPY.title}`,
      FEATURES_GAPS_COPY.description,
    ]),
    markdownSection(ANSWER_EXAMPLE_HEADING, [ANSWER_EXAMPLE_SUBCOPY]),
    markdownSection("Pricing", [
      PRICING_HEADING,
      PRICING_SUBHEADING,
      "",
      "See the dedicated pricing page: [Pricing](https://www.usenotra.com/pricing.md)",
    ]),
    markdownSection(
      FAQ_CONTENT.heading,
      FAQ_CONTENT.items.flatMap((item) => [
        `### ${item.question}`,
        item.answer,
        "",
      ])
    ),
    markdownSection("Call to Action", [
      CTA_BANNER_HEADING,
      CTA_BANNER_SUBCOPY,
      "",
      "[Start for free](https://app.usenotra.com/signup)",
    ]),
  ].join("\n");
}

export function buildBrandMarkdown() {
  const colorLines = BRAND_COLORS.map(
    (color) => `- ${color.name}: ${color.hex} (${color.value}) - ${color.usage}`
  );
  const fontLines = BRAND_FONTS.map(
    (font) => `- [${font.name}](${font.googleFontsUrl}) - ${font.role}`
  );

  return [
    "# Brand Guidelines",
    "",
    "Official assets and guidelines to help you reference the Notra brand, including our logo, colors and typography.",
    "",
    markdownSection("Assets", [
      `- [Brand kit (zip)](${SITE_URL}${BRAND_ASSETS.zip})`,
      `- Logo: [SVG](${SITE_URL}${BRAND_ASSETS.mark.svg}) / [PNG](${SITE_URL}${BRAND_ASSETS.mark.png})`,
      `- Wordmark: [SVG](${SITE_URL}${BRAND_ASSETS.wordmark.svg}) / [PNG](${SITE_URL}${BRAND_ASSETS.wordmark.png})`,
      `- Wordmark for dark surfaces: [SVG](${SITE_URL}${BRAND_ASSETS.wordmarkDark.svg}) / [PNG](${SITE_URL}${BRAND_ASSETS.wordmarkDark.png})`,
    ]),
    markdownSection("Logo", [
      "The Notra mark is a feather with a lavender fill and ink strokes.",
      "Keep it on a light surface and give it room to breathe. On dark surfaces, place the mark on a cream tile.",
    ]),
    markdownSection("Colors", colorLines),
    markdownSection("Typography", [
      ...fontLines,
      "",
      "The wordmark sets the Notra name in Inter Semibold next to the mark.",
    ]),
  ].join("\n");
}
