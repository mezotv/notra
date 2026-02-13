export const CHANGELOG_COMPANIES = [
  {
    slug: "better-auth",
    name: "Better Auth",
    domain: "better-auth.com",
    description:
      "The most comprehensive authentication framework for TypeScript.",
    url: "https://better-auth.com",
    accentColor: "#000000",
  },
  {
    slug: "cal-com",
    name: "Cal.com",
    domain: "cal.com",
    description:
      "A fully customizable scheduling software for individuals, businesses taking calls and developers building scheduling platforms where users meet users.",
    url: "https://cal.com",
    accentColor: "#292929",
  },
  {
    slug: "databuddy",
    name: "Databuddy",
    domain: "databuddy.me",
    description:
      "Experience powerful, privacy-first analytics that matches Google Analytics feature-for-feature without compromising user data. Zero cookies required, 100% data ownership, and AI-powered insights to help your business grow while staying compliant.",
    url: "https://databuddy.cc",
    accentColor: "#000000",
  },
  {
    slug: "langfuse",
    name: "Langfuse",
    domain: "langfuse.com",
    description:
      "Traces, evals, prompt management and metrics to debug and improve your LLM application. Integrates with Langchain, OpenAI, LlamaIndex, LiteLLM, and more.",
    url: "https://langfuse.com",
    accentColor: "#E11312",
  },
] as const;

export function getCompany(slug: string) {
  return CHANGELOG_COMPANIES.find((c) => c.slug === slug);
}

export function getEntrySlug(infoPath: string) {
  return (
    infoPath
      .split("/")
      .pop()
      ?.replace(/\.mdx$/, "") ?? ""
  );
}
