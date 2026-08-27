import { AI_AGENT_SIGNATURES } from "@usenotra/geo/signatures";

import {
  GEO_BROWSER_IMITATION_AGENT,
  GEO_MARKDOWN_NEGOTIATION_AGENT,
} from "@/constants/geo-accept";

export const GEO_HIDDEN_TRAFFIC_CONFIDENCE = "heuristic";

const HEURISTIC_SIGNATURE_AGENTS = AI_AGENT_SIGNATURES.filter(
  (signature) => signature.confidence === GEO_HIDDEN_TRAFFIC_CONFIDENCE
).map((signature) => signature.agent);

export const GEO_HIDDEN_TRAFFIC_SOURCES: readonly string[] = [
  GEO_MARKDOWN_NEGOTIATION_AGENT,
  GEO_BROWSER_IMITATION_AGENT,
  ...HEURISTIC_SIGNATURE_AGENTS,
];

export const GEO_HIDDEN_TRAFFIC_SOURCES_PARAM =
  GEO_HIDDEN_TRAFFIC_SOURCES.join(",");
