import type { EngineIconKey, EngineIconRule } from "../types/geo";

const ENGINE_ICON_RULES: readonly EngineIconRule[] = [
  {
    key: "tencent",
    patterns: ["tencent", "hunyuan", "hy3"],
  },
  {
    key: "xiaomi",
    patterns: ["xiaomi"],
  },
  {
    key: "copilot",
    patterns: ["copilot", "bingbot", "microsoft", "bing/"],
  },
  {
    key: "cursor",
    patterns: ["cursor", "composer", "anysphere"],
  },
  {
    key: "opencode",
    patterns: ["opencode"],
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
    key: "google",
    patterns: [
      "ai-overview",
      "google-agent",
      "google-cloudvertex",
      "googleother",
      "googlebot",
    ],
    exact: ["google"],
  },
  {
    key: "gemini",
    patterns: ["gemini", "google", "bard", "palm"],
  },
  {
    key: "apple",
    patterns: ["applebot", "apple"],
  },
  {
    key: "amazon",
    patterns: ["amazonbot", "amzn-"],
    exact: ["amazon"],
  },
  {
    key: "duckduckgo",
    patterns: ["duckassist", "duckduckgo"],
  },
  {
    key: "cloudflare",
    patterns: ["cloudflare"],
  },
  {
    key: "tiktok",
    patterns: ["tiktok", "bytespider", "bytedance", "trae"],
  },
  {
    key: "mozilla",
    patterns: ["tabstack"],
  },
  {
    key: "manus",
    patterns: ["manus"],
  },
  {
    key: "firecrawl",
    patterns: ["firecrawl"],
  },
  {
    key: "cohere",
    patterns: ["cohere"],
  },
  {
    key: "kimi",
    patterns: ["kimi", "moonshot"],
  },
  {
    key: "zai",
    patterns: ["chatglm", "zhipu", "glm-", "zai/", "z.ai/", "z-ai/"],
    exact: ["glm", "zai", "z.ai", "z-ai"],
  },
  {
    key: "exa",
    patterns: ["exabot", "exasearchbot"],
    exact: ["exa"],
  },
  {
    key: "parallel",
    patterns: ["shapbot", "shap-user"],
    exact: ["parallel"],
  },
  {
    key: "commoncrawl",
    patterns: ["ccbot", "common crawl", "commoncrawl"],
  },
  {
    key: "youcom",
    patterns: ["youbot", "you.com"],
    exact: ["you"],
  },
  {
    key: "liner",
    patterns: ["linerbot", "liner"],
  },
  {
    key: "cline",
    patterns: ["cline", "agentbot", "vscodeextension"],
  },
  {
    key: "devin",
    patterns: ["devin", "cognition"],
  },
  {
    key: "diffbot",
    patterns: ["diffbot"],
  },
  {
    key: "tavily",
    patterns: ["tavily"],
  },
  {
    key: "timpi",
    patterns: ["timpi"],
  },
  {
    key: "huawei",
    patterns: ["pangubot", "huawei", "petalbot"],
  },
  {
    key: "kagi",
    patterns: ["kagi"],
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
    patterns: ["meta-", "meta/", "llama", "facebook", "muse-spark"],
    exact: ["meta"],
  },
  {
    key: "grok",
    patterns: ["grok", "x-ai", "xai", "spacexai"],
  },
  {
    key: "qwen",
    patterns: ["qwen", "qwq", "alibaba", "tongyi"],
  },
  {
    key: "cli",
    patterns: [
      "curl",
      "wget",
      "python-",
      "aiohttp",
      "go-http-client",
      "node-fetch",
      "node.js fetch",
      "undici",
      "axios",
      "bun",
      "deno",
      "java http",
      "okhttp",
      "libwww",
      "postman",
      "insomnia",
      "httpie",
    ],
  },
  {
    key: "agent",
    patterns: [
      "ai2bot",
      "omgili",
      "yiyanbot",
      "baidu",
      "browser-imitating",
      "markdown-negotiating",
    ],
  },
];

export function resolveEngineIconKey(engine: string): EngineIconKey | null {
  const value = engine.trim().toLowerCase();
  if (value.length === 0) {
    return null;
  }
  for (const rule of ENGINE_ICON_RULES) {
    if (rule.exact?.includes(value)) {
      return rule.key;
    }
  }
  for (const rule of ENGINE_ICON_RULES) {
    if (rule.patterns.some((pattern) => value.includes(pattern))) {
      return rule.key;
    }
  }
  return null;
}

/**
 * Maps a mentioned brand ("ChatGPT Plus", "Claude 3.5 Sonnet") to a first-party
 * engine mark. Token-exact so "Google Analytics" does not become Gemini.
 */
const BRAND_NAME_ENGINE_TOKENS: readonly (readonly [string, EngineIconKey])[] =
  [
    ["chatgpt", "openai"],
    ["claude", "claude"],
    ["gemini", "gemini"],
    ["google", "google"],
    ["perplexity", "perplexity"],
    ["copilot", "copilot"],
    ["grok", "grok"],
    ["mistral", "mistral"],
    ["deepseek", "deepseek"],
  ];

const BRAND_NAME_TOKEN_SPLIT = /[\s/_-]+/;

export function brandNameEngineIconKey(name: string): EngineIconKey | null {
  const tokens = name
    .trim()
    .toLowerCase()
    .split(BRAND_NAME_TOKEN_SPLIT)
    .filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return null;
  }
  for (const [token, key] of BRAND_NAME_ENGINE_TOKENS) {
    if (tokens.includes(token)) {
      return key;
    }
  }
  return null;
}
