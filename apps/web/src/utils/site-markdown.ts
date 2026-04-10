import {
  COMPARISON_FEATURES,
  PRICING_PLANS,
  SOCIAL_PROOF_LOGOS,
} from "@/utils/constants";
import { markdownSection } from "@/utils/markdown";

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
      "There is no permanent free tier. When you sign up, an automatic Basic trial is applied for 3 days at no cost so you can explore Notra before committing to a paid plan.",
  },
  {
    question: "How do I get started?",
    answer:
      "Sign up, connect your GitHub, and Notra starts generating content within minutes. Your 3-day Basic trial begins automatically.",
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
  const unit = billingPeriod === "monthly" ? "month" : "year";
  return `$${price}/${unit}`;
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
      "- [Pricing](https://usenotra.com/pricing.md)",
      "- [Blog](https://usenotra.com/blog.md)",
      "- [Changelog examples](https://usenotra.com/changelog.md)",
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
        const basic =
          typeof feature.basic === "boolean"
            ? feature.basic
              ? "Yes"
              : "No"
            : feature.basic;
        const pro =
          typeof feature.pro === "boolean"
            ? feature.pro
              ? "Yes"
              : "No"
            : feature.pro;
        const enterprise =
          typeof feature.enterprise === "boolean"
            ? feature.enterprise
              ? "Yes"
              : "No"
            : feature.enterprise;

        return `- ${feature.name}: Basic ${basic}, Pro ${pro}, Enterprise ${enterprise}`;
      })
    )
  ).join("\n");

  return [
    "# Pricing",
    "",
    "Choose the right Notra plan for your team.",
    "",
    "Start with a 3-day free trial. Upgrade when you need more integrations, posts, or team seats.",
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
    "Turn your daily work into publish-ready content.",
    "",
    "Notra connects to GitHub and soon Slack and Linear to turn shipped work into ready-to-publish changelogs, blog posts, and social updates.",
    "",
    "Primary CTA: [Start for free](https://app.usenotra.com/signup)",
    "",
    markdownSection("Explore in Markdown", [
      "- [Features](https://usenotra.com/features.md)",
      "- [Pricing](https://usenotra.com/pricing.md)",
      "- [Blog](https://usenotra.com/blog.md)",
      "- [Changelog](https://usenotra.com/changelog.md)",
    ]),
    markdownSection("Social Proof", [
      "Teams that ship faster, write less.",
      "People at these companies use Notra to keep their audience in the loop without slowing down development.",
      "",
      ...socialProofLines,
    ]),
    markdownSection("Features", [
      "Your team ships. Notra writes it up.",
      "Notra watches your team's activity in the background and drafts content that matches your brand voice.",
      "",
      "See the dedicated feature page: [Features](https://usenotra.com/features.md)",
    ]),
    markdownSection("Pricing", [
      "Pick the plan that fits your team.",
      "Start with a 3-day free trial. Upgrade when you need more integrations, posts, or team seats.",
      "",
      "See the dedicated pricing page: [Pricing](https://usenotra.com/pricing.md)",
    ]),
    markdownSection(
      "FAQ",
      FAQ_ITEMS.flatMap((item) => [`### ${item.question}`, item.answer, ""])
    ),
    markdownSection("Call to Action", [
      "Stop writing content from scratch.",
      "Let Notra turn your team's shipped work into changelogs, blog posts, and social updates you can publish today.",
      "",
      "[Start for free](https://app.usenotra.com/signup)",
    ]),
  ].join("\n");
}
