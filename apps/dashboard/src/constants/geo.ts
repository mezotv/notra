import type { GeoGroundedEngine } from "@/types/geo";

export const GEO_ENGINES = [
  "openai/gpt-5.4",
  "anthropic/claude-sonnet-4.6",
  "google/gemini-3-flash",
  "anthropic/claude-opus-5",
  "anthropic/claude-haiku-4.5",
  "openai/gpt-5.4-mini",
] as const;

export const GEO_JUDGE_MODEL = "openai/gpt-5.4-nano";

export const GEO_OPENAI_API_KEY_ENV = "OPENAI_API_KEY";
export const GEO_ANTHROPIC_API_KEY_ENV = "ANTHROPIC_API_KEY";
export const GEO_PERPLEXITY_API_KEY_ENV = "PERPLEXITY_API_KEY";

const hasEnv = (name: string): boolean => {
  const value = process.env[name];
  return typeof value === "string" && value.length > 0;
};

export const GEO_GROUNDED_ENGINES: readonly GeoGroundedEngine[] = [
  {
    key: "openai/gpt-5.4-grounded",
    label: "ChatGPT (web)",
    model: "openai/gpt-5.4",
    provider: "gateway-openai",
    envVar: null,
    isAvailable: () => true,
  },
  {
    key: "anthropic/claude-sonnet-4.6-grounded",
    label: "Claude (web)",
    model: "anthropic/claude-sonnet-4.6",
    provider: "gateway-anthropic",
    envVar: null,
    isAvailable: () => true,
  },
  {
    key: "google/gemini-3-flash-grounded",
    label: "Gemini (web)",
    model: "google/gemini-3-flash",
    provider: "gateway-google",
    envVar: null,
    isAvailable: () => true,
  },
  {
    key: "openai-direct-grounded",
    label: "ChatGPT (web)",
    model: "gpt-5.4",
    provider: "direct-openai",
    envVar: GEO_OPENAI_API_KEY_ENV,
    isAvailable: () => hasEnv(GEO_OPENAI_API_KEY_ENV),
  },
  {
    key: "anthropic-direct-grounded",
    label: "Claude (web)",
    model: "claude-sonnet-4-6",
    provider: "direct-anthropic",
    envVar: GEO_ANTHROPIC_API_KEY_ENV,
    isAvailable: () => hasEnv(GEO_ANTHROPIC_API_KEY_ENV),
  },
  {
    key: "perplexity-sonar",
    label: "Perplexity",
    model: "sonar",
    provider: "direct-perplexity",
    envVar: GEO_PERPLEXITY_API_KEY_ENV,
    isAvailable: () => hasEnv(GEO_PERPLEXITY_API_KEY_ENV),
  },
];

const groundedEngineLabels = Object.fromEntries(
  GEO_GROUNDED_ENGINES.map((engine) => [engine.key, engine.label])
);

export const GEO_ENGINE_LABELS: Record<string, string> = {
  "openai/gpt-5.4": "ChatGPT",
  "anthropic/claude-sonnet-4.6": "Claude",
  "google/gemini-3-flash": "Gemini",
  "anthropic/claude-opus-5": "Claude Opus",
  "anthropic/claude-haiku-4.5": "Claude Haiku",
  "openai/gpt-5.4-mini": "GPT-5.4 mini",
  ...groundedEngineLabels,
};

export const GEO_MODEL_USAGE_SOURCE = "openrouter";
export const GEO_MODEL_USAGE_ATTRIBUTION =
  "Source: OpenRouter (openrouter.ai/rankings)";
export const GEO_MODEL_USAGE_API_KEY_ENV = "OPENROUTER_API_KEY";
export const GEO_MODEL_USAGE_ENDPOINT =
  "https://openrouter.ai/api/v1/datasets/rankings-daily";
export const GEO_MODEL_USAGE_PERIOD = "week";
export const GEO_MODEL_USAGE_OTHER_KEY = "other";
export const GEO_MODEL_USAGE_MODELS_ENDPOINT =
  "https://openrouter.ai/api/v1/models";
export const GEO_MODEL_USAGE_INGEST_LIMIT = 40;
export const GEO_MODEL_USAGE_FETCH_TIMEOUT_MS = 20_000;
export const GEO_MODEL_USAGE_DEFAULT_LIMIT = 12;
export const GEO_MODEL_USAGE_DEFAULT_WEEKS = 8;

export const GEO_MAX_PROMPTS = 8;
export const GEO_GROUNDED_MAX_PROMPTS = 6;
export const GEO_GROUNDED_MAX_SEARCHES = 3;
export const GEO_ANSWER_MAX_TOKENS = 600;
export const GEO_GROUNDED_ANSWER_MAX_TOKENS = 1200;
export const GEO_JUDGE_MAX_TOKENS = 800;
export const GEO_SCAN_CONCURRENCY = 4;
export const GEO_EXCERPT_MAX_LENGTH = 300;
export const GEO_PROMPT_MIN_LENGTH = 8;
export const GEO_PROMPT_MAX_LENGTH = 300;
export const GEO_DISCOVERY_MODEL = "anthropic/claude-sonnet-4.6";
export const GEO_DISCOVERY_MAX_TOKENS = 4000;
export const GEO_DISCOVERY_MAX_ALIASES = 6;
export const GEO_DISCOVERY_MIN_COMPETITORS = 5;
export const GEO_DISCOVERY_MAX_COMPETITORS = 10;
export const GEO_DISCOVERY_MIN_PROMPTS = 10;
export const GEO_DISCOVERY_MAX_PROMPTS = 14;
export const GEO_DISCOVERY_MAX_BRANDED_PROMPTS = 3;
export const GEO_DISCOVERY_ALIAS_LIMIT = 8;
export const GEO_DISCOVERY_COMPETITOR_LIMIT = 12;
export const GEO_DISCOVERY_SYSTEM_PROMPT =
  "You are a search visibility analyst. You read a company's website and derive the brand identity and the buyer questions that decide whether an AI assistant recommends this company. Respond only with the requested structured data.";
export const GEO_ANSWER_SYSTEM_PROMPT =
  "You are a helpful AI assistant. Answer the user's question directly and concretely, naming specific products or companies where relevant.";
