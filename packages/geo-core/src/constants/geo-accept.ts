import type { GeoAcceptFingerprint, GeoCliClientPattern } from "../types/geo";

export const GEO_MARKDOWN_ACCEPT_MATCHERS: readonly string[] = [
  "text/markdown",
  "text/x-markdown",
];
export const GEO_MARKDOWN_NEGOTIATION_AGENT = "Markdown-negotiating agent";
export const GEO_MARKDOWN_NEGOTIATION_CATEGORY = "assistant-browse";
export const GEO_MARKDOWN_NEGOTIATION_CONFIDENCE = "heuristic";
export const GEO_ACCEPT_FINGERPRINT_CONFIDENCE = "reported";
export const GEO_ACCEPT_FINGERPRINTS: readonly GeoAcceptFingerprint[] = [
  {
    agent: "Cursor",
    userAgentPattern: "googlebot/2.1",
    accept:
      "text/markdown,text/html;q=0.9,application/xhtml+xml;q=0.8,application/xml;q=0.7,image/webp;q=0.6,*/*;q=0.5",
  },
  {
    agent: "OpenCode",
    userAgentPattern: "chrome/",
    accept:
      "text/html;q=1.0, application/xhtml+xml;q=0.9, text/plain;q=0.8, text/markdown;q=0.7, */*;q=0.1",
  },
  {
    agent: "OpenCode",
    userAgentPattern: "chrome/",
    accept: "text/plain;q=1.0, text/markdown;q=0.9, text/html;q=0.8, */*;q=0.1",
  },
  {
    agent: "OpenCode",
    userAgentPattern: "chrome/",
    accept:
      "text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, */*;q=0.1",
  },
];

export const GEO_BROWSER_IMITATION_AGENT = "Browser-imitating agent";
export const GEO_BROWSER_IMITATION_CONFIDENCE = "heuristic";
export const GEO_CHROMIUM_UA_PATTERNS: readonly string[] = ["chrome/", "edg/"];

export const GEO_CLI_CLIENT_PATTERNS: readonly GeoCliClientPattern[] = [
  { pattern: "curl/", agent: "curl" },
  { pattern: "wget/", agent: "wget" },
  { pattern: "python-requests/", agent: "python-requests" },
  { pattern: "python-urllib/", agent: "python-urllib" },
  { pattern: "python-httpx/", agent: "python-httpx" },
  { pattern: "aiohttp/", agent: "aiohttp" },
  { pattern: "go-http-client/", agent: "Go-http-client" },
  { pattern: "node-fetch/", agent: "node-fetch" },
  { pattern: "undici", agent: "undici" },
  { pattern: "axios/", agent: "axios" },
  { pattern: "bun/", agent: "Bun" },
  { pattern: "deno/", agent: "Deno" },
  { pattern: "java/", agent: "Java HTTP client" },
  { pattern: "okhttp/", agent: "OkHttp" },
  { pattern: "libwww-perl/", agent: "libwww-perl" },
  { pattern: "postmanruntime/", agent: "Postman" },
  { pattern: "insomnia/", agent: "Insomnia" },
  { pattern: "httpie/", agent: "HTTPie" },
];
export const GEO_CLI_EXACT_USER_AGENTS: Readonly<Record<string, string>> = {
  node: "Node.js fetch",
};

export const GEO_HIDDEN_TRAFFIC_SOURCES: ReadonlySet<string> = new Set([
  GEO_MARKDOWN_NEGOTIATION_AGENT,
  GEO_BROWSER_IMITATION_AGENT,
]);
