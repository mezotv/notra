import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/.well-known/", "/_next/"],
    },
    sitemap: "https://www.usenotra.com/sitemap.xml",
  };
}
