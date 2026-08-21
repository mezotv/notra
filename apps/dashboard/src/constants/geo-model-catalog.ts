import type {
  GeoModelCatalogEntry,
  GeoModelProvider,
  GeoModelProviderId,
} from "@/types/geo";

/**
 * Curated model catalog for GEO scans.
 *
 * Ids, `zdr` and `released` mirror the Vercel AI Gateway feed
 * (https://ai-gateway.vercel.sh/v1/models). `zdr` means "has at least one
 * zero-data-retention host": `all` = every host, `some` = some hosts (the
 * gateway routes to them when ZDR is requested), `none` = no ZDR host — the
 * model can only run when the project explicitly approves it.
 *
 * TODO(geo): replace with a synced DB catalog (Vercel feed + OpenRouter for
 * OpenRouter-only models), admin UI in the console and "new model dropped"
 * notifications. When adding an OpenRouter-only model set
 * `gateways: ["openrouter"]` and mirror it in `VERCEL_UNSUPPORTED_MODELS`
 * (`@notra/ai/constants/router`).
 */
export const GEO_MODEL_PROVIDERS: readonly GeoModelProvider[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    hint: "Claude Opus, Sonnet, Fable",
    brand: "claude",
    featured: true,
  },
  {
    id: "openai",
    label: "ChatGPT",
    hint: "GPT-5.4, GPT-5.5",
    brand: "openai",
    featured: true,
  },
  {
    id: "google",
    label: "Gemini",
    hint: "Gemini 3 Flash, 3.1 Pro",
    brand: "gemini",
    featured: true,
  },
  {
    id: "moonshotai",
    label: "Moonshot",
    hint: "Kimi K3, K2.6",
    brand: "moonshot",
    featured: true,
  },
  {
    id: "meta",
    label: "Meta",
    hint: "Muse Spark 1.1, 1.2",
    brand: "meta",
    featured: false,
  },
  {
    id: "zai",
    label: "Z.AI",
    hint: "GLM 5.1, 5.2",
    brand: "zai",
    featured: false,
  },
  {
    id: "spacexai",
    label: "xAI",
    hint: "Grok 4.5, 4.6",
    brand: "grok",
    featured: false,
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    hint: "V4 Pro, V4 Flash",
    brand: "deepseek",
    featured: false,
  },
];

export const GEO_MODEL_CATALOG = [
  // Anthropic
  {
    id: "anthropic/claude-opus-5",
    provider: "anthropic",
    label: "Claude Opus",
    zdr: "all",
    released: "2026-07-24",
    default: true,
    gateways: ["vercel", "openrouter"],
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    provider: "anthropic",
    label: "Claude Sonnet",
    zdr: "all",
    released: "2026-02-17",
    default: true,
    gateways: ["vercel", "openrouter"],
  },
  {
    id: "anthropic/claude-haiku-4.5",
    provider: "anthropic",
    label: "Claude Haiku",
    zdr: "all",
    released: "2025-10-15",
    default: true,
    gateways: ["vercel", "openrouter"],
  },
  {
    id: "anthropic/claude-fable-5",
    provider: "anthropic",
    label: "Claude Fable 5",
    zdr: "none",
    released: "2026-07-01",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  // OpenAI
  {
    id: "openai/gpt-5.4",
    provider: "openai",
    label: "ChatGPT",
    zdr: "some",
    released: "2026-03-05",
    default: true,
    gateways: ["vercel", "openrouter"],
  },
  {
    id: "openai/gpt-5.5",
    provider: "openai",
    label: "GPT-5.5",
    zdr: "some",
    released: "2026-04-24",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  {
    id: "openai/gpt-5.4-mini",
    provider: "openai",
    label: "GPT-5.4 mini",
    zdr: "some",
    released: "2026-03-17",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  // Google
  {
    id: "google/gemini-3-flash",
    provider: "google",
    label: "Gemini",
    zdr: "some",
    released: "2025-12-17",
    default: true,
    gateways: ["vercel", "openrouter"],
  },
  {
    id: "google/gemini-3.1-pro-preview",
    provider: "google",
    label: "Gemini 3.1 Pro",
    zdr: "some",
    released: "2026-02-19",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  {
    id: "google/gemini-3.5-flash",
    provider: "google",
    label: "Gemini 3.5 Flash",
    zdr: "some",
    released: "2026-05-19",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  // Moonshot
  {
    id: "moonshotai/kimi-k3",
    provider: "moonshotai",
    label: "Kimi K3",
    zdr: "some",
    released: "2026-07-16",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  {
    id: "moonshotai/kimi-k2.6",
    provider: "moonshotai",
    label: "Kimi K2.6",
    zdr: "some",
    released: "2026-04-20",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  // Meta
  {
    id: "meta/muse-spark-1.2",
    provider: "meta",
    label: "Muse Spark 1.2",
    zdr: "none",
    released: "2026-08-05",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  {
    id: "meta/muse-spark-1.1",
    provider: "meta",
    label: "Muse Spark 1.1",
    zdr: "none",
    released: "2026-07-09",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  // Z.AI
  {
    id: "zai/glm-5.2",
    provider: "zai",
    label: "GLM 5.2",
    zdr: "some",
    released: "2026-06-16",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  {
    id: "zai/glm-5.1",
    provider: "zai",
    label: "GLM 5.1",
    zdr: "some",
    released: "2026-04-07",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  // xAI
  {
    id: "spacexai/grok-4.6",
    provider: "spacexai",
    label: "Grok 4.6",
    zdr: "none",
    released: "2026-08-12",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  {
    id: "spacexai/grok-4.5",
    provider: "spacexai",
    label: "Grok 4.5",
    zdr: "none",
    released: "2026-07-08",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  // DeepSeek
  {
    id: "deepseek/deepseek-v4-pro",
    provider: "deepseek",
    label: "DeepSeek V4 Pro",
    zdr: "some",
    released: "2026-04-23",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
  {
    id: "deepseek/deepseek-v4-flash",
    provider: "deepseek",
    label: "DeepSeek V4 Flash",
    zdr: "some",
    released: "2026-04-23",
    default: false,
    gateways: ["vercel", "openrouter"],
  },
] as const satisfies readonly GeoModelCatalogEntry[];

export type GeoEngineId = (typeof GEO_MODEL_CATALOG)[number]["id"];

const catalogById = new Map<string, GeoModelCatalogEntry>(
  GEO_MODEL_CATALOG.map((entry) => [entry.id, entry])
);

const catalogByProvider = new Map<GeoModelProviderId, GeoModelCatalogEntry[]>();
for (const entry of GEO_MODEL_CATALOG) {
  const models = catalogByProvider.get(entry.provider);
  if (models) {
    models.push(entry);
  } else {
    catalogByProvider.set(entry.provider, [entry]);
  }
}

export function getGeoModelCatalogEntry(
  engine: string
): GeoModelCatalogEntry | undefined {
  return catalogById.get(engine);
}

/** True when the model has at least one zero-data-retention host. */
export function isGeoEngineZdrCapable(engine: string): boolean {
  const entry = catalogById.get(engine);
  return entry ? entry.zdr !== "none" : true;
}

export function geoModelsForProvider(
  providerId: GeoModelProviderId
): readonly GeoModelCatalogEntry[] {
  return catalogByProvider.get(providerId) ?? [];
}
