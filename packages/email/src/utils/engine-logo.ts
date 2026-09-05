import { EMAIL_CONFIG } from "./config";

/** PNG copies of models.dev marks: SVG images are not supported by many mail clients. */
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

export function engineEmailLogoSrc(engineFamily: string): string | undefined {
  const key = engineFamily.trim().toLowerCase();
  const slug = ENGINE_LOGO_SLUG[key];
  return slug
    ? `${EMAIL_CONFIG.getSiteUrl()}/logos/ai-engines/${slug}.png`
    : undefined;
}
