import { classifyUserAgent } from "@usenotra/geo/classify";
import {
  GEO_AI_REFERRER_HOSTS,
  GEO_BROWSER_UA_PATTERNS,
  GEO_NON_AI_BOT_PATTERNS,
} from "@/constants/geo";
import type { GeoVisitorClassification, GeoVisitorInput } from "@/types/geo";

const UNKNOWN_CLASSIFICATION: GeoVisitorClassification = {
  visitorType: "unknown",
  source: "unknown",
  agent: "",
  category: "",
  confidence: "",
};

const HUMAN_CLASSIFICATION: GeoVisitorClassification = {
  visitorType: "human",
  source: "human",
  agent: "",
  category: "",
  confidence: "",
};

function matchesHost(host: string, key: string): boolean {
  return host === key || host.endsWith(`.${key}`);
}

export function resolveAiReferrer(referer: string | undefined): string | null {
  if (!referer) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(referer);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const hostWithPath = `${host}${parsed.pathname.toLowerCase()}`;

  for (const [key, assistant] of Object.entries(GEO_AI_REFERRER_HOSTS)) {
    if (key.includes("/")) {
      if (hostWithPath.startsWith(key)) {
        return assistant;
      }
      continue;
    }
    if (matchesHost(host, key)) {
      return assistant;
    }
  }

  return null;
}

export function classifyVisitor(
  input: GeoVisitorInput
): GeoVisitorClassification {
  const userAgent = input.userAgent?.trim() ?? "";

  if (userAgent.length > 0) {
    const match = classifyUserAgent(userAgent);
    if (match) {
      return {
        visitorType: "crawler",
        source: match.agent,
        agent: match.agent,
        category: match.category,
        confidence: match.confidence,
      };
    }
  }

  const assistant = resolveAiReferrer(input.referer);
  if (assistant) {
    return {
      visitorType: "ai_referral",
      source: assistant,
      agent: "",
      category: "assistant-referral",
      confidence: "reported",
    };
  }

  if (userAgent.length === 0) {
    return UNKNOWN_CLASSIFICATION;
  }

  const haystack = userAgent.toLowerCase();
  const isKnownBot = GEO_NON_AI_BOT_PATTERNS.some((pattern) =>
    haystack.includes(pattern)
  );
  const isBrowser = GEO_BROWSER_UA_PATTERNS.some((pattern) =>
    haystack.includes(pattern)
  );

  if (isKnownBot || isBrowser) {
    return HUMAN_CLASSIFICATION;
  }

  return UNKNOWN_CLASSIFICATION;
}
