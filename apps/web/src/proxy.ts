import { Tracker } from "@bydefault/vercel";
import { createDualmarkMiddleware } from "@dualmark/nextjs";
import { after, type NextRequest } from "next/server";
import { HOMEPAGE_LINK_HEADER, SITE_URL } from "@/utils/urls";

const tracker = new Tracker({
  token: process.env.BYDEFAULT_TOKEN as string,
  exclude: ["/api"],
});

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
      "/favicon.ico",
      "/icon.svg",
      "/llms-full.txt",
      "/llms.txt",
      "/manifest.json",
      "/marketing",
      "/notra-mark.svg",
      "/og-image.png",
      "/robots.txt",
      "/rss.xml",
      "/sitemap.xml",
      "/subprocessors",
      "/testimonials",
      "/web-app-manifest-192x192.png",
      "/web-app-manifest-512x512.png",
    ],
  },
});

function appendLinkHeader(headers: Headers, value: string) {
  const existing = headers.get("Link");
  headers.set("Link", existing ? `${existing}, ${value}` : value);
}

export async function proxy(request: NextRequest) {
  const response = await dualmarkProxy(request);

  after(async () => {
    await tracker.track(request);
  });

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
