import { PRICING_PLANS, SOCIAL_PROOF_LOGOS } from "@/utils/constants";
import { markdownResponse, markdownSection } from "@/utils/markdown";

export async function GET() {
  const pricingLines = Object.values(PRICING_PLANS)
    .map((plan) => {
      const planHeader =
        plan.name === "Enterprise"
          ? `### ${plan.name} - Contact us`
          : `### ${plan.name} - $${plan.pricing.monthly}/month or $${plan.pricing.annually}/year`;

      return [
        planHeader,
        plan.description,
        `CTA: [${plan.cta.label}](${plan.cta.href})`,
        "Features:",
        ...plan.features.map((feature) => `- ${feature}`),
        "",
      ].join("\n");
    })
    .join("\n");

  const socialProofLines = SOCIAL_PROOF_LOGOS.map(
    (logo) => `- [${logo.name}](${logo.href})`
  );

  const markdown = [
    "# Notra",
    "",
    "Turn your daily work into publish-ready content.",
    "",
    "Now in public beta. Notra connects to GitHub, Linear and Slack to turn shipped work into ready-to-publish content.",
    "",
    "Primary CTA: [Start for free](https://app.usenotra.com)",
    "",
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
      "### Activity feed",
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
    markdownSection("From shipped code to published content", [
      "Notra follows your workflow, picks up on what matters, and writes the first draft so you do not have to.",
      "",
      "### Auto-generate changelogs",
      "Every merged PR becomes a changelog entry. No more manual release notes.",
      "",
      "### Draft blog posts from features",
      "Ship a feature and Notra writes the first draft of the announcement post.",
      "",
      "### Social updates from milestones",
      "Releases and milestones become short social posts you can review, tweak, and publish.",
    ]),
    markdownSection("Testimonial", [
      "\"Notra's been good to have as I get content created from other people's work on the team, without asking them or really doing anything. We can actually create decent content and talk about even the small things we ship, easy.\"",
      "- Will De Ath, Head of Growth, Consent",
    ]),
    markdownSection("Pricing", [
      "Pick the plan that fits your team.",
      "Start generating content for free. Upgrade when you need more integrations, posts, or team seats.",
      "",
      pricingLines,
    ]),
    markdownSection("FAQ", [
      "### What is Notra and who is it for?",
      "Notra is a content automation tool for product and engineering teams. Connect your GitHub repos and Notra picks up merged PRs and shipped features to draft changelogs, blog posts, and social updates.",
      "",
      "### What kind of content does Notra generate?",
      "Changelog entries from merged PRs, blog post drafts when you ship features, and social updates when you hit milestones. Every draft matches your brand voice so it reads like your team wrote it.",
      "",
      "### Which integrations are available right now?",
      "The beta ships with GitHub. Connect your repos and Notra starts pulling in PRs, commits, and releases right away. Linear, Slack, and more are on the roadmap.",
      "",
      "### How does brand voice matching work?",
      "During setup you provide a few examples of your existing content. Notra learns your tone, vocabulary, and style so every draft sounds like your team wrote it.",
      "",
      "### Is my data secure with Notra?",
      "Integration tokens are encrypted at rest. Your source code is never stored. Notra only reads the metadata it needs to write drafts, like PR titles, descriptions, and commit messages.",
      "",
      "### How do I get started?",
      "Sign up for free, connect your GitHub, and Notra starts generating content within minutes. No credit card required.",
    ]),
    markdownSection("Call to Action", [
      "Stop writing content from scratch.",
      "Let Notra turn your team's shipped work into changelogs, blog posts, and social updates you can publish today.",
      "",
      "[Start for free](https://app.usenotra.com/signup)",
    ]),
  ].join("\n");

  return markdownResponse(markdown);
}
