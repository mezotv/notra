import { JOURNEY_ID_PARAM } from "./constants";

const HTTP_PROTOCOL = /^https?:\/\//i;
const EXISTING_JOURNEY_PARAM = new RegExp(`[?&](?:amp;)?${JOURNEY_ID_PARAM}=`);

export const RESOLVE_BASE = "https://journey.invalid";

function isSameHost(target: string, host: string | undefined): boolean {
  if (!host) {
    return false;
  }
  try {
    const parsed = new URL(target, RESOLVE_BASE);
    return parsed.hostname.toLowerCase() === host.trim().toLowerCase();
  } catch {
    return false;
  }
}

export function isTaggableTarget(
  target: string,
  host: string | undefined
): boolean {
  const value = target.trim();
  if (value.length === 0 || value.startsWith("#") || value.startsWith("<")) {
    return false;
  }
  if (EXISTING_JOURNEY_PARAM.test(value)) {
    return false;
  }
  if (value.startsWith("//")) {
    return isSameHost(value, host);
  }
  if (value.startsWith("/")) {
    return true;
  }
  if (HTTP_PROTOCOL.test(value)) {
    return isSameHost(value, host);
  }
  return false;
}

export function appendJourneyParam(
  target: string,
  journeyId: string,
  ampersand = "&"
): string {
  const hashIndex = target.indexOf("#");
  const base = hashIndex === -1 ? target : target.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? "" : target.slice(hashIndex);

  let separator = "?";
  if (base.endsWith("?")) {
    separator = "";
  } else if (base.includes("?")) {
    separator = ampersand;
  }

  return `${base}${separator}${JOURNEY_ID_PARAM}=${journeyId}${fragment}`;
}
