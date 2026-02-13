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
    description: "The open-source scheduling infrastructure for everyone.",
    url: "https://cal.com",
    accentColor: "#292929",
  },
  {
    slug: "databuddy",
    name: "Databuddy",
    domain: "databuddy.me",
    description:
      "The analytics platform that tracks what matters for your product.",
    url: "https://databuddy.me",
    accentColor: "#000000",
  },
  {
    slug: "langfuse",
    name: "Langfuse",
    domain: "langfuse.com",
    description:
      "Open-source LLM engineering platform for traces, evals, and prompt management.",
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
