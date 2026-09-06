import type { GeoGroundedEngine, GeoModelGateway } from "../types/geo";

type CodingAgentSpec = Pick<
  GeoGroundedEngine,
  "label" | "model" | "provider" | "zdr"
>;

/**
 * Catalog engine id → gateway model used for grounded web-search scans.
 * Sol Rei is the Codex label; the Vercel feed only exposes `openai/gpt-5.6-sol`.
 */
const CODING_AGENT_ENGINES: Readonly<Record<string, CodingAgentSpec>> = {
  "claude-code/claude-fable-5.1": {
    label: "Fable 5.1",
    model: "anthropic/claude-fable-5.1",
    provider: "gateway-anthropic",
    zdr: "none",
  },
  "claude-code/claude-opus-5": {
    label: "Opus 5",
    model: "anthropic/claude-opus-5",
    provider: "gateway-anthropic",
    zdr: "all",
  },
  "codex/gpt-6-astra": {
    label: "GPT-6 Astra",
    model: "openai/gpt-6-astra",
    provider: "gateway-openai",
    zdr: "some",
  },
  "codex/gpt-5.6-sol-rei": {
    label: "GPT-5.6 Sol Rei",
    model: "openai/gpt-5.6-sol",
    provider: "gateway-openai",
    zdr: "some",
  },
};

/**
 * Claude Code and Codex are catalog engines that scan through the AI gateway
 * with web search, not through a dedicated agent host. OpenCode stays on Box.
 */
export function isCodingAgentGateway(
  gateway: GeoModelGateway | undefined
): gateway is "claude-code" | "codex" {
  return gateway === "claude-code" || gateway === "codex";
}

export function codingAgentGroundedEngine(
  engine: string
): GeoGroundedEngine | null {
  const spec = CODING_AGENT_ENGINES[engine];
  if (!spec) {
    return null;
  }
  return {
    key: engine,
    label: spec.label,
    model: spec.model,
    provider: spec.provider,
    zdr: spec.zdr,
    envVar: null,
    isAvailable: () => true,
  };
}
