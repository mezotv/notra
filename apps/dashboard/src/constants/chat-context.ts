import type { ChatContextSuggestedIntegration } from "@/types/components/chat-input";

export const CHAT_CONTEXT_SUGGESTED_INTEGRATIONS: readonly ChatContextSuggestedIntegration[] =
  [
    {
      id: "github",
      name: "GitHub",
      description: "Add repositories as context",
      href: "github",
      keywords: ["github", "repo", "repository", "context"],
    },
    {
      id: "linear",
      name: "Linear",
      description: "Add teams as context",
      href: "linear",
      keywords: ["linear", "issues", "team", "context"],
    },
    {
      id: "mcp",
      name: "MCP",
      description: "Connect custom tools",
      href: "mcp",
      keywords: ["mcp", "tools", "server", "custom"],
    },
  ];
