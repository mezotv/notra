/**
 * Claude Code and Codex scan through the same Upstash Box OpenCode host as
 * OpenCode. Catalog identity stays separate; only the OpenRouter model id
 * changes. Sol Rei is the Codex label; OpenRouter exposes `gpt-5.6-sol`.
 */
const GEO_BOX_CODING_AGENT_MODELS: Readonly<Record<string, string>> = {
  "claude-code/claude-fable-5.1": "openrouter/anthropic/claude-fable-5.1",
  "claude-code/claude-opus-5": "openrouter/anthropic/claude-opus-5",
  "codex/gpt-6-astra": "openrouter/openai/gpt-6-astra",
  "codex/gpt-5.6-sol-rei": "openrouter/openai/gpt-5.6-sol",
};

export function geoBoxModelForEngine(engine: string): string | null {
  return GEO_BOX_CODING_AGENT_MODELS[engine] ?? null;
}

export function isGeoBoxCodingAgent(engine: string): boolean {
  return geoBoxModelForEngine(engine) !== null;
}
