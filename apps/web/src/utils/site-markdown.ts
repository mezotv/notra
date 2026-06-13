import { BRAND_ASSETS, BRAND_COLORS, BRAND_FONTS } from "@/lib/brand/constants";
import {
  ANNUAL_DISCOUNT_PERCENT,
  ANNUAL_FREE_MONTHS,
  COMPARISON_FEATURES,
  PRICING_PLANS,
  SOCIAL_PROOF_LOGOS,
} from "@/utils/constants";
import { markdownSection } from "@/utils/markdown";
import { SITE_URL } from "@/utils/urls";

const FAQ_ITEMS = [
  {
    question: "What is Notra and who is it for?",
    answer:
      "Notra is a content automation tool for product and engineering teams. Connect your GitHub repos and Notra picks up merged PRs and shipped features to draft changelogs, blog posts, and social updates.",
  },
  {
    question: "What kind of content does Notra generate?",
    answer:
      "Changelog entries from merged PRs, blog post drafts when you ship features, and social updates when you hit milestones. Every draft matches your brand voice so it reads like your team wrote it.",
  },
  {
    question: "Which integrations are available right now?",
    answer:
      "The beta ships with GitHub. Connect your repos and Notra starts pulling in PRs, commits, and releases right away. Linear, Slack, and more are on the roadmap.",
  },
  {
    question: "How does brand voice matching work?",
    answer:
      "During setup you provide a few examples of your existing content. Notra learns your tone, vocabulary, and style so every draft sounds like your team wrote it.",
  },
  {
    question: "Is my data secure with Notra?",
    answer:
      "Integration tokens are encrypted at rest. Your source code is never stored. Notra only reads the metadata it needs to write drafts, like PR titles, descriptions, and commit messages.",
  },
  {
    question: "Is there a free tier?",
    answer:
      "There is no permanent free tier. When you sign up, an automatic Basic trial is applied for 7 days at no cost so you can explore Notra before committing to a paid plan.",
  },
  {
    question: "How do I get started?",
    answer:
      "Sign up, connect your GitHub, and Notra starts generating content within minutes. Your 7-day Basic trial begins automatically.",
  },
] as const;

function renderPlanPrice(
  plan: (typeof PRICING_PLANS)[keyof typeof PRICING_PLANS],
  billingPeriod: "monthly" | "annually"
) {
  if (plan.name === "Enterprise") {
    return "Contact us";
  }

  const price = plan.pricing[billingPeriod];

  if (billingPeriod === "annually") {
    return `$${price}/year (save ${ANNUAL_DISCOUNT_PERCENT}% vs monthly billing)`;
  }

  return `$${price}/month`;
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
        `Monthly: ${renderPlanPrice(plan, "monthly")}`,
        `Annual: ${renderPlanPrice(plan, "annually")}`,
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
        const basic = renderComparisonValue(feature.basic);
        const pro = renderComparisonValue(feature.pro);
        const enterprise = renderComparisonValue(feature.enterprise);

        return `- ${feature.name}: Basic ${basic}, Pro ${pro}, Enterprise ${enterprise}`;
      })
    )
  ).join("\n");

  return [
    "# Pricing",
    "",
    "Choose the right Notra plan for your team.",
    "",
    "Start with a 7-day free trial. Upgrade when you need more integrations, posts, or team seats.",
    "",
    `Annual billing saves ${ANNUAL_DISCOUNT_PERCENT}% compared to monthly billing (${ANNUAL_FREE_MONTHS} months free).`,
    "",
    planSections,
    "## Feature Comparison",
    "",
    comparisonSections,
  ].join("\n");
}

export function buildLandingMarkdown() {
  const socialProofLines = SOCIAL_PROOF_LOGOS.map(
    (logo) => `- [${logo.name}](${logo.href})`
  );

  return [
    "# Notra",
    "",
    "Ship more. Write less. Reach more.",
    "",
    "Notra turns shipped work into changelogs, launch posts, and social updates in your voice.",
    "",
    "Primary CTA: [Start for free](https://app.usenotra.com/signup)",
    "",
    markdownSection("Explore in Markdown", [
      "- [Features](https://www.usenotra.com/features.md)",
      "- [Pricing](https://www.usenotra.com/pricing.md)",
      "- [Blog](https://www.usenotra.com/blog.md)",
      "- [Changelog](https://www.usenotra.com/changelog.md)",
    ]),
    markdownSection("Social Proof", [
      "Fast-moving teams trust Notra to tell their story.",
      "Startups use Notra to turn every shipped feature into a changelog, post, or update, without hiring a writer.",
      "",
      ...socialProofLines,
    ]),
    markdownSection("Features", [
      "Your team ships. Notra tells the story.",
      "Notra quietly watches GitHub, Linear, and Slack, then drafts changelogs, posts, and announcements in your brand voice.",
      "",
      "See the dedicated feature page: [Features](https://www.usenotra.com/features.md)",
    ]),
    markdownSection("Pricing", [
      "Pricing that scales with what you ship.",
      "Start with a 7-day free trial. Upgrade when you need more integrations, posts, or team seats.",
      "",
      "See the dedicated pricing page: [Pricing](https://www.usenotra.com/pricing.md)",
    ]),
    markdownSection(
      "FAQ",
      FAQ_ITEMS.flatMap((item) => [`### ${item.question}`, item.answer, ""])
    ),
    markdownSection("Call to Action", [
      "Stop letting great work go unannounced.",
      "Your team ships every week. Let Notra turn it into the posts and announcements your audience should be seeing.",
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
