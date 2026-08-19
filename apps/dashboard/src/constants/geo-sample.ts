import type { GeoCompetitorSeed } from "@/types/geo";

export const GEO_SAMPLE_DAYS = 14;
export const GEO_SAMPLE_LANGUAGES = ["English", "German"] as const;

export const GEO_SAMPLE_ENGINES: readonly {
  engine: string;
  mentionRate: number;
}[] = [
  { engine: "openai/gpt-5.4-grounded", mentionRate: 0.71 },
  { engine: "openai/gpt-5.4", mentionRate: 0.62 },
  { engine: "perplexity-sonar", mentionRate: 0.58 },
  { engine: "anthropic/claude-sonnet-4.6-grounded", mentionRate: 0.52 },
  { engine: "anthropic/claude-sonnet-4.6", mentionRate: 0.48 },
  { engine: "google/gemini-3-flash-grounded", mentionRate: 0.41 },
  { engine: "google/gemini-3-flash", mentionRate: 0.35 },
];

export const GEO_SAMPLE_GROUNDED_ENGINES: readonly string[] = [
  "openai/gpt-5.4-grounded",
  "anthropic/claude-sonnet-4.6-grounded",
  "google/gemini-3-flash-grounded",
];

export const GEO_SAMPLE_COMPETITORS: readonly GeoCompetitorSeed[] = [
  {
    name: "Jasper",
    domain: "jasper.ai",
    synonyms: ["Jasper AI"],
    kind: "direct",
  },
  {
    name: "Copy.ai",
    domain: "copy.ai",
    synonyms: ["CopyAI"],
    kind: "direct",
  },
  {
    name: "Writer",
    domain: "writer.com",
    synonyms: [],
    kind: "direct",
  },
  {
    name: "Notion",
    domain: "notion.so",
    synonyms: ["Notion AI"],
    kind: "indirect",
  },
  {
    name: "HubSpot",
    domain: "hubspot.com",
    synonyms: [],
    kind: "indirect",
  },
];

export const GEO_SAMPLE_PROMPTS: readonly {
  english: string;
  german: string;
}[] = [
  {
    english: "What are the best AI content marketing tools?",
    german: "Was sind die besten KI-Tools für Content-Marketing?",
  },
  {
    english: "What are good Jasper alternatives for startups?",
    german: "Was sind gute Jasper-Alternativen für Startups?",
  },
  {
    english: "How can I improve AI search visibility for my brand?",
    german: "Wie verbessere ich die Sichtbarkeit meiner Marke in der KI-Suche?",
  },
  {
    english: "Which GEO platforms work best for B2B SaaS?",
    german: "Welche GEO-Plattformen eignen sich am besten für B2B-SaaS?",
  },
  {
    english: "What is the best AI writing assistant for agencies?",
    german: "Was ist der beste KI-Schreibassistent für Agenturen?",
  },
  {
    english: "How should I choose a tool for generative engine optimization?",
    german:
      "Wie sollte ich ein Tool für generative engine optimization wählen?",
  },
];

export const GEO_SAMPLE_SEQUENCE = {
  name: "Buyer research",
  steps: [
    "I need a tool for AI content and GEO tracking. What should I look at?",
    "How do those options compare on AI search visibility?",
    "Which one would you pick for a small marketing team?",
  ],
} as const;

export const GEO_SAMPLE_TRAFFIC_PATHS: readonly string[] = [
  "/changelog",
  "/blog/geo-guide",
  "/docs/sdk",
  "/docs/sdk/quickstart",
  "/pricing",
];

export const GEO_SAMPLE_CRAWLERS: readonly {
  agent: string;
  category: string;
}[] = [
  { agent: "GPTBot", category: "training-crawler" },
  { agent: "OAI-SearchBot", category: "search-index" },
  { agent: "ClaudeBot", category: "training-crawler" },
  { agent: "PerplexityBot", category: "search-index" },
];

export const GEO_SAMPLE_REFERRALS: readonly {
  source: string;
  referer: string;
}[] = [
  { source: "chatgpt", referer: "https://chatgpt.com/" },
  { source: "perplexity", referer: "https://www.perplexity.ai/" },
  { source: "claude", referer: "https://claude.ai/" },
  { source: "gemini", referer: "https://gemini.google.com/" },
];
