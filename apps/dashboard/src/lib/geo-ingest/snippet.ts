import { GEO_INGEST_PATH, GEO_INGEST_TOKEN_ENV } from "@/constants/geo";
import type { GeoIngestFramework, GeoIngestSnippets } from "@/types/geo";

const FALLBACK_APP_URL = "https://app.usenotra.com";

export function buildGeoAppUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? FALLBACK_APP_URL;
  return new URL("/", base).origin;
}

export function buildGeoIngestUrl(): string {
  return new URL(GEO_INGEST_PATH, buildGeoAppUrl()).toString();
}

function processTokenExpr(): string {
  return `process.env.${GEO_INGEST_TOKEN_ENV}!`;
}

function denoTokenExpr(): string {
  return `Deno.env.get("${GEO_INGEST_TOKEN_ENV}")!`;
}

function buildNextSnippet(appUrl: string): string {
  return [
    'import { createGeoProxy } from "@usenotra/geo/next";',
    'import { after, NextResponse } from "next/server";',
    "",
    "const geo = createGeoProxy({",
    `  token: ${processTokenExpr()},`,
    `  endpoint: "${appUrl}",`,
    "});",
    "",
    "export function proxy(request: Request) {",
    "  after(() => geo(request));",
    "  return NextResponse.next();",
    "}",
  ].join("\n");
}

function buildNuxtSnippet(appUrl: string): string {
  return [
    'import { createGeoHandler } from "@usenotra/geo/nuxt";',
    "",
    "const geo = createGeoHandler({",
    `  token: ${processTokenExpr()},`,
    `  endpoint: "${appUrl}",`,
    "});",
    "",
    "export default defineEventHandler(async (event) => {",
    "  await geo(event);",
    "});",
  ].join("\n");
}

function buildNetlifySnippet(appUrl: string): string {
  return [
    'import { createGeoHandler } from "@usenotra/geo/netlify";',
    'import type { Context } from "@netlify/edge-functions";',
    "",
    "const geo = createGeoHandler({",
    `  token: ${denoTokenExpr()},`,
    `  endpoint: "${appUrl}",`,
    "});",
    "",
    "export default (request: Request, context: Context) => {",
    "  geo(request, context);",
    "};",
    "",
    'export const config = { path: "/*" };',
  ].join("\n");
}

export function buildGeoSnippet(
  appUrl: string,
  framework: GeoIngestFramework = "next"
): string {
  if (framework === "nuxt") {
    return buildNuxtSnippet(appUrl);
  }
  if (framework === "netlify") {
    return buildNetlifySnippet(appUrl);
  }
  return buildNextSnippet(appUrl);
}

export function buildGeoSnippets(appUrl: string): GeoIngestSnippets {
  return {
    next: buildGeoSnippet(appUrl, "next"),
    nuxt: buildGeoSnippet(appUrl, "nuxt"),
    netlify: buildGeoSnippet(appUrl, "netlify"),
  };
}
