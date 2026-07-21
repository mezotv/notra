import type { FaqContent } from "@/types/landing/faq";

export const FAQ_CONTENT: FaqContent = {
  heading: "Common questions",
  subcopy: "Short answers to what comes up most.",
  items: [
    {
      id: "small-team",
      question: "We are a small team. Is Notra overkill?",
      answer:
        "Not at all. Notra is built for small teams who ship fast and have no time to write updates. It turns work you have already shipped into polished content, so you get a marketing team's output without hiring one.",
      defaultOpen: false,
    },
    {
      id: "agents",
      question: "How do AI agents integrate with Notra?",
      answer:
        "Agents can discover Notra through llms.txt, agent.json, the OpenAPI schema, auth.md, and the Notra MCP server, so they can read and act on your content programmatically.",
      defaultOpen: false,
    },
    {
      id: "brand-voice",
      question: "Will the content sound like us?",
      answer:
        "Yes. Notra learns your brand voice from your existing writing, and every draft is styled to match it before it reaches you.",
      defaultOpen: false,
    },
    {
      id: "workflow",
      question: "Do we have to change how we work?",
      answer:
        "No. Notra works from your merged PRs and shipped features using the tools you already have, so nothing changes about how your team builds.",
      defaultOpen: false,
    },
    {
      id: "content-types",
      question: "What kind of content does Notra generate?",
      answer:
        "Changelog entries from merged PRs, blog post drafts when you ship features, and social updates when you hit milestones. Every draft matches your brand voice so it reads like your team wrote it.",
      defaultOpen: true,
    },
  ],
};
