const MODELS_DEV_LOGO_BASE = "https://models.dev/logos";

/** Engine-family keys → models.dev logo slugs (same source as GEO provider logos). */
const ENGINE_LOGO_SLUG: Record<string, string> = {
  openai: "openai",
  chatgpt: "openai",
  claude: "anthropic",
  anthropic: "anthropic",
  gemini: "google",
  google: "google",
  perplexity: "perplexity",
  grok: "xai",
  xai: "xai",
  mistral: "mistral",
  deepseek: "deepseek",
  meta: "meta",
  qwen: "alibaba",
  amazon: "amazon-bedrock",
  copilot: "azure",
  cursor: "cursor",
  kimi: "moonshotai",
  moonshot: "moonshotai",
  zai: "zai",
};

export function engineEmailLogoSrc(engineFamily: string): string {
  const key = engineFamily.trim().toLowerCase();
  const slug = ENGINE_LOGO_SLUG[key] ?? key;
  return `${MODELS_DEV_LOGO_BASE}/${encodeURIComponent(slug)}.svg`;
}
