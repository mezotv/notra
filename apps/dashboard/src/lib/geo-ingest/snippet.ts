import { GEO_INGEST_PATH } from "@/constants/geo";

const FALLBACK_APP_URL = "https://app.usenotra.com";

export function buildGeoAppUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    FALLBACK_APP_URL;
  return new URL("/", base).origin;
}

export function buildGeoIngestUrl(): string {
  return new URL(GEO_INGEST_PATH, buildGeoAppUrl()).toString();
}

export function buildGeoSnippet(appUrl: string): string {
  return [
    "// proxy.ts on Next.js 16, middleware.ts before that",
    'import { createGeoProxy } from "@usenotra/geo/next";',
    'import { NextResponse } from "next/server";',
    "",
    "const geo = createGeoProxy({",
    '  token: process.env.NOTRA_GEO_TOKEN ?? "",',
    `  endpoint: "${appUrl}",`,
    "});",
    "",
    "export function proxy(request, event) {",
    "  geo(request, event);",
    "  return NextResponse.next();",
    "}",
  ].join("\n");
}
