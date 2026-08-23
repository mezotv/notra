import {
  ASSET_EXTENSIONS,
  ASSET_PATH_PREFIXES,
  DEFAULT_EXCLUDE,
  LLMS_TXT_FILE,
} from "./constants";
import type { GeoExcludeRule, GeoPathRule } from "./types";

function matchesPath(pathname: string, prefix: string): boolean {
  if (prefix === "/") {
    return true;
  }
  const normalized = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  return pathname === normalized || pathname.startsWith(`${normalized}/`);
}

function isAssetPath(pathname: string): boolean {
  for (const prefix of ASSET_PATH_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }

  const lastSegment = pathname.slice(pathname.lastIndexOf("/") + 1);
  if (LLMS_TXT_FILE.test(lastSegment)) {
    return false;
  }

  const dot = lastSegment.lastIndexOf(".");
  if (dot <= 0) {
    return false;
  }

  return ASSET_EXTENSIONS.includes(lastSegment.slice(dot).toLowerCase());
}

export function matchesRule(
  request: Request,
  url: URL,
  rule: GeoPathRule
): boolean {
  if (typeof rule === "string") {
    return matchesPath(url.pathname, rule);
  }
  if (rule instanceof RegExp) {
    return rule.test(url.pathname);
  }
  return rule(request, url);
}

export function matchesAnyRule(
  request: Request,
  url: URL,
  rules: readonly GeoPathRule[]
): boolean {
  for (const rule of rules) {
    if (matchesRule(request, url, rule)) {
      return true;
    }
  }
  return false;
}

function isExcluded(
  request: Request,
  url: URL,
  rules: GeoExcludeRule[]
): boolean {
  return matchesAnyRule(request, url, rules);
}

export function shouldTrackRequest(
  request: Request,
  url: URL,
  exclude?: GeoExcludeRule[]
): boolean {
  if (request.method.toUpperCase() !== "GET") {
    return false;
  }

  if (isAssetPath(url.pathname)) {
    return false;
  }

  return !isExcluded(request, url, exclude ?? DEFAULT_EXCLUDE);
}
