import type { OpenAINamespace } from "@notra/ai/types/provider-native-tool-discovery";

export const PROVIDER_TOOL_SEARCH_TOOL_NAME = "toolSearch";

export const DEFAULT_NATIVE_TOOL_DISCOVERY_DESCRIPTION =
  "Built-in Notra app tools use provider-native dynamic tool discovery. Common discovery tools are loaded immediately; content, brand, GitHub, Linear, and post tools are deferred and loaded by the provider only when relevant.";

export const NATIVE_MCP_DESCRIPTION =
  "External MCP servers are connected through provider-native MCP support. The provider discovers server tools on demand without Notra loading MCP tool schemas up front.";

export const OPENAI_NAMESPACES = {
  content: {
    name: "notra_content",
    description:
      "Notra content creation and post management tools for drafts, updates, lookup, and viewing.",
  },
  organization: {
    name: "notra_organization",
    description:
      "Notra organization tools for brand identities, brand references, and connected integrations.",
  },
  skills: {
    name: "notra_skills",
    description:
      "Notra writing skill discovery and loading tools for organization-specific guidance.",
  },
  github: {
    name: "notra_github",
    description:
      "GitHub integration tools for pull requests, releases, and commits.",
  },
  linear: {
    name: "notra_linear",
    description: "Linear integration tools for issues, projects, and cycles.",
  },
  firecrawl: {
    name: "notra_firecrawl",
    description:
      "Firecrawl-powered source-aware research tools for current public information.",
  },
  dev: {
    name: "notra_development",
    description: "Development-only Notra testing tools.",
  },
} satisfies Record<string, OpenAINamespace>;

export const CONTENT_TOOL_NAMES = new Set([
  "createChangelog",
  "createBlogPost",
  "createTwitterPost",
  "createLinkedInPost",
  "createInvestorUpdate",
  "createImage",
  "updatePost",
  "viewPost",
  "getAvailablePosts",
  "getPost",
]);

export const ORGANIZATION_TOOL_NAMES = new Set([
  "listBrandIdentities",
  "getBrandIdentity",
  "getAvailableIntegrations",
  "getAvailableBrandReferences",
]);

export const SKILL_TOOL_NAMES = new Set([
  "listAvailableSkills",
  "getSkillByName",
]);

export const GITHUB_TOOL_NAMES = new Set([
  "getPullRequests",
  "getReleaseByTag",
  "getCommitsByTimeframe",
]);

export const LINEAR_TOOL_NAMES = new Set([
  "getLinearIssues",
  "getLinearProjects",
  "getLinearCycles",
]);

export const FIRECRAWL_TOOL_NAMES = new Set(["webSearch"]);
