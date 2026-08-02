import { Tracker } from "@bydefault/vercel";
import { createDualmarkMiddleware } from "@dualmark/nextjs";
import { createBeaconMiddleware } from "@notra/beacon/middleware";
import { after, type NextRequest, NextResponse } from "next/server";
import { HOMEPAGE_LINK_HEADER, SITE_URL } from "@/utils/urls";

const beaconIngestUrl = process.env.BEACON_INGEST_URL;
const beaconToken = process.env.BEACON_ORG_TOKEN;
const beaconOrganizationId = process.env.BEACON_ORG_ID;
const beacon =
  beaconIngestUrl && beaconToken && beaconOrganizationId
    ? createBeaconMiddleware({
        ingestUrl: beaconIngestUrl,
        token: beaconToken,
        organizationId: beaconOrganizationId,
      })
    : null;

const bydefaultToken = process.env.BYDEFAULT_TOKEN;
const tracker = bydefaultToken
  ? new Tracker({
      token: bydefaultToken,
      exclude: ["/api"],
    })
  : null;

const dualmarkProxy = createDualmarkMiddleware({
  siteUrl: SITE_URL,
  middleware: {
    skipPaths: [
      "/.well-known",
      "/api",
      "/apple-icon.png",
      "/contributors",
      "/demo-dark.webp",
      "/demo.webp",
      "/design.md",
      "/favicon.ico",
      "/icon.svg",
      "/llms-full.txt",
      "/llms.txt",
      "/manifest.json",
      "/marketing",
      "/notra-mark.svg",
      "/og",
      "/og-image.png",
      "/robots.txt",
      "/rss.xml",
      "/sitemap.xml",
      "/testimonials",
      "/web-app-manifest-192x192.png",
      "/web-app-manifest-512x512.png",
    ],
  },
});

function trackAiTraffic(request: NextRequest) {
  if (!beacon) {
    return;
  }

  const pending: Promise<unknown>[] = [];
  beacon(request, {
    waitUntil: (promise) => {
      pending.push(promise);
    },
  });

  if (pending.length > 0) {
    after(Promise.all(pending));
  }
}

function appendLinkHeader(headers: Headers, value: string) {
  const existing = headers.get("Link");
  headers.set("Link", existing ? `${existing}, ${value}` : value);
}

export async function proxy(request: NextRequest) {
  trackAiTraffic(request);

  if (
    request.nextUrl.pathname === "/" &&
    request.nextUrl.searchParams.get("mode") === "agent"
  ) {
    const response = NextResponse.rewrite(new URL("/agent", request.url));

    if (tracker) {
      after(async () => {
        await tracker.track(request);
      });
    }

    return response;
  }

  const response = await dualmarkProxy(request);

  if (tracker) {
    after(async () => {
      await tracker.track(request);
    });
  }

  if (
    request.nextUrl.pathname === "/" &&
    response.status === 200 &&
    !response.headers.has("x-middleware-rewrite")
  ) {
    appendLinkHeader(response.headers, HOMEPAGE_LINK_HEADER);
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/|favicon.ico|md/|api(?:/|$)).*)",
      missing: [{ type: "header", key: "next-router-prefetch" }],
    },
  ],
};
