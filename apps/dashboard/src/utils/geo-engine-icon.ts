import type { EngineIconKey, EngineIconRule } from "@/types/geo";

const ENGINE_ICON_RULES: readonly EngineIconRule[] = [
  {
    key: "copilot",
    patterns: ["copilot", "bingbot", "microsoft", "bing/"],
  },
  {
    key: "openai",
    patterns: ["openai", "gpt", "chatgpt", "oai-"],
  },
  {
    key: "claude",
    patterns: ["anthropic", "claude"],
  },
  {
    key: "gemini",
    patterns: ["gemini", "google", "bard", "palm"],
  },
  {
    key: "perplexity",
    patterns: ["perplexity", "sonar"],
  },
  {
    key: "mistral",
    patterns: ["mistral", "mixtral", "magistral", "codestral", "ministral"],
  },
  {
    key: "deepseek",
    patterns: ["deepseek"],
  },
  {
    key: "meta",
    patterns: ["meta-", "meta/", "llama", "facebook"],
  },
  {
    key: "grok",
    patterns: ["grok", "x-ai", "xai"],
  },
  {
    key: "qwen",
    patterns: ["qwen", "qwq", "alibaba"],
  },
];

export function resolveEngineIconKey(engine: string): EngineIconKey | null {
  const value = engine.trim().toLowerCase();
  if (value.length === 0) {
    return null;
  }
  for (const rule of ENGINE_ICON_RULES) {
    if (rule.patterns.some((pattern) => value.includes(pattern))) {
      return rule.key;
    }
  }
  return null;
}
