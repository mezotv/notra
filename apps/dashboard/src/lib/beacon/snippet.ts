import { BEACON_INGEST_PATH } from "@/constants/geo";

const FALLBACK_APP_URL = "https://app.usenotra.com";

export function buildBeaconIngestUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    FALLBACK_APP_URL;
  return new URL(BEACON_INGEST_PATH, base).toString();
}

export function buildBeaconSnippet(
  ingestUrl: string,
  organizationId: string
): string {
  return [
    "// middleware.ts (proxy.ts on Next.js 16)",
    'import { createBeaconMiddleware } from "@notra/beacon/middleware";',
    'import { NextResponse } from "next/server";',
    "",
    "const beacon = createBeaconMiddleware({",
    `  ingestUrl: "${ingestUrl}",`,
    '  token: process.env.BEACON_ORG_TOKEN ?? "",',
    `  organizationId: "${organizationId}",`,
    "});",
    "",
    "export function middleware(request: Request) {",
    "  beacon(request);",
    "  return NextResponse.next();",
    "}",
  ].join("\n");
}
