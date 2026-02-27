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
    domain: "databuddy.cc",
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
  {
    slug: "autumn",
    name: "Autumn",
    domain: "useautumn.com",
    description:
      "Autumn is the easiest and most flexible way to set up your app's pricing model. With 3 functions, you can integrate Stripe payments, track usage limits, control feature entitlements, credits, add-ons & much more.",
    url: "https://useautumn.com",
    accentColor: "#9c5bff",
  },
  {
    slug: "marble",
    name: "Marble",
    domain: "marblecms.com",
    description:
      "Marble is a simple way to manage your blog and media. Write, upload, and publish with a clean interface and simple API.",
    url: "https://marblecms.com",
    accentColor: "#202027",
  },
  {
    slug: "neon",
    name: "Neon",
    domain: "neon.tech",
    description:
      "Serverless Postgres built for developers, with instant branching, autoscaling, and modern workflows for database-backed applications.",
    url: "https://neon.tech",
    accentColor: "#37C38F",
  },
  {
    slug: "unkey",
    name: "Unkey",
    domain: "unkey.com",
    description:
      "Easily integrate necessary API features like API keys, rate limiting, and usage analytics, ensuring your API is ready to scale.",
    url: "https://unkey.com",
    accentColor: "#000000",
  },
] as const;

const MDX_EXTENSION_REGEX = /\.mdx$/;

export function getCompany(slug: string) {
  return CHANGELOG_COMPANIES.find((c) => c.slug === slug);
}

export function getEntrySlug(infoPath: string) {
  return infoPath.split("/").pop()?.replace(MDX_EXTENSION_REGEX, "") ?? "";
}
