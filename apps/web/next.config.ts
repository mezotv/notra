import path from "node:path";
import { withDualmark } from "@dualmark/nextjs";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import { SHOWCASE_COMPANIES } from "./src/utils/showcase";
import { SITE_URL } from "./src/utils/urls";

const SHOWCASE_COMPANY_SLUGS = SHOWCASE_COMPANIES.map(
  (company) => company.slug
);

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  transpilePackages: ["@notra/ui"],
  rewrites: async () => ({
    beforeFiles: [
      {
        source: "/api/c15t/:path*",
        destination: `${process.env.NEXT_PUBLIC_C15T_BACKEND_URL}/:path*`,
      },
    ],
    afterFiles: [],
    fallback: [],
  }),
  redirects: async () => [
    ...SHOWCASE_COMPANY_SLUGS.map((slug) => ({
      source: `/showcase/${slug}`,
      destination: `/changelog/${slug}`,
      permanent: true,
    })),
    {
      source: "/showcase/:name/:slug",
      destination: "/changelog/:name/:slug",
      permanent: true,
    },
    {
      source: "/showcase",
      destination: "/changelog",
      permanent: true,
    },
    {
      source: "/founder-chat",
      destination: "https://cal.com/dominikkoch",
      permanent: false,
    },
    {
      source: "/founder-call",
      destination: "https://www.usenotra.com/founder-chat",
      permanent: true,
    },
    {
      source: "/discord",
      destination: "https://discord.gg/2qzGZDsnwB",
      permanent: false,
    },
    {
      source: "/x",
      destination: "https://x.com/usenotra",
      permanent: false,
    },
    {
      source: "/linkedin",
      destination: "https://www.linkedin.com/company/usenotra",
      permanent: false,
    },
    {
      source: "/github",
      destination: "https://github.com/usenotra/notra",
      permanent: false,
    },
  ],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' databuddy.cc *.databuddy.cc va.vercel-scripts.com",
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self'",
            "img-src 'self' data: blob: databuddy.cc *.databuddy.cc avatars.githubusercontent.com",
            "connect-src 'self' databuddy.cc *.databuddy.cc *.inth.app *.c15t.com *.c15t.dev",
            "frame-src 'none'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
          ].join("; "),
        },
      ],
    },
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

const withMDX = createMDX();

export default withDualmark(withMDX(nextConfig), {
  siteUrl: SITE_URL,
});
