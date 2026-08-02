import { classifyRequest } from "./classify";
import { reportAiHit } from "./report";
import type {
  BeaconConfig,
  BeaconEvent,
  BeaconEventContext,
  BeaconMatch,
  BeaconRequestLike,
} from "./types";

const MAX_UA_LENGTH = 512;
const MAX_PATH_LENGTH = 512;
const MAX_REFERER_LENGTH = 512;

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function shouldSample(sample: number | undefined): boolean {
  if (sample === undefined || sample >= 1) {
    return true;
  }
  if (sample <= 0) {
    return false;
  }
  return Math.random() < sample;
}

function buildEvent(
  config: BeaconConfig,
  request: BeaconRequestLike,
  match: BeaconMatch
): BeaconEvent | null {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return null;
  }

  const referer = request.headers.get("referer");

  return {
    token: config.token,
    organizationId: config.organizationId,
    agent: match.agent,
    category: match.category,
    confidence: match.confidence,
    path: truncate(url.pathname, MAX_PATH_LENGTH),
    host: request.headers.get("host") ?? url.host,
    method: request.method,
    referer: referer ? truncate(referer, MAX_REFERER_LENGTH) : null,
    ua: truncate(request.headers.get("user-agent") ?? "", MAX_UA_LENGTH),
    ts: new Date().toISOString(),
  };
}

export function trackAiRequest(
  config: BeaconConfig,
  request: BeaconRequestLike,
  context?: BeaconEventContext
): BeaconMatch | null {
  try {
    const match = classifyRequest(request.headers);
    if (!match) {
      return null;
    }
    if (!shouldSample(config.sample)) {
      return match;
    }

    const event = buildEvent(config, request, match);
    if (event) {
      reportAiHit(config, event, context);
    }

    return match;
  } catch {
    return null;
  }
}

export function createBeaconMiddleware(config: BeaconConfig) {
  return (
    request: BeaconRequestLike,
    context?: BeaconEventContext
  ): BeaconMatch | null => trackAiRequest(config, request, context);
}
