import { defineConfig } from "blume";

import { docsNavigation } from "./src/constants/navigation";
import { docsRedirects } from "./src/constants/redirects";
import { docolinSchema } from "./src/schemas/frontmatter";

export default defineConfig({
  title: "Notra Documentation",
  description:
    "Documentation for Notra: track your brand across AI answer engines and turn your team's work into content.",
  content: { root: "docs" },
  deployment: {
    output: "server",
    adapter: "vercel",
    site: "https://docs.usenotra.com",
  },
  logo: {
    image: {
      light: "/logo/notra-wordmark.svg",
      dark: "/logo/notra-wordmark-dark.svg",
      alt: "Notra",
    },
    text: "",
    href: "/overview",
  },
  theme: { accent: "#8b5cf6", mode: "system" },
  github: {
    owner: "usenotra",
    repo: "notra",
    branch: "main",
    dir: "apps/docs",
  },
  lastModified: true,
  navigation: docsNavigation,
  redirects: docsRedirects,
  frontmatter: { extend: { docolin: docolinSchema } },
  markdown: {
    imageZoom: true,
    codeBlocks: { theme: { light: "github-light", dark: "github-dark" } },
  },
  search: { provider: "orama" },
  ai: {
    llmsTxt: true,
    openInChat: ["chatgpt", "claude"],
    ask: {
      enabled: true,
      provider: "gateway",
      instructions:
        "Answer questions about Notra using the documentation, and link to the relevant guides or API operations.",
    },
    mcp: { enabled: true, route: "/mcp" },
  },
  openapi: {
    enabled: true,
    spec: "public/openapi.json",
    route: "/api/endpoints",
    codeSamples: ["curl", "js", "python"],
  },
  seo: {
    sitemap: true,
    robots: true,
    structuredData: true,
    x: { handle: "@usenotra" },
  },
  analytics: {
    scripts: [
      {
        src: "https://cdn.databuddy.cc/databuddy.js",
        strategy: "async",
        attributes: {
          "data-client-id": "58e85c38-d3fe-445c-bebc-f525899a7073",
          crossorigin: "anonymous",
        },
      },
    ],
  },
});
