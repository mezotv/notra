import path from "node:path";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const SHOWCASE_COMPANY_SLUGS = [
  "autumn",
  "better-auth",
  "cal-com",
  "databuddy",
  "langfuse",
  "marble",
  "neon",
  "openclaw",
  "unkey",
];

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
        source: "/",
        destination: "/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/index.md",
        destination: "/markdown",
      },
      {
        source: "/pricing",
        destination: "/pricing/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/pricing.md",
        destination: "/pricing/markdown",
      },
      {
        source: "/features",
        destination: "/features/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/features.md",
        destination: "/features/markdown",
      },
      {
        source: "/blog",
        destination: "/blog/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/blog.md",
        destination: "/blog/markdown",
      },
      {
        source: "/blog/engineers-are-great-marketing",
        destination: "/blog/engineers-are-great-for-marketing",
      },
      {
        source: "/blog/engineers-are-great-marketing",
        destination: "/blog/engineers-are-great-for-marketing/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/blog/engineers-are-great-marketing.md",
        destination: "/blog/engineers-are-great-for-marketing/markdown",
      },
      {
        source: "/blog/markdown",
        destination: "/blog/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/blog/:slug",
        destination: "/blog/:slug/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/blog/:slug.md",
        destination: "/blog/:slug/markdown",
      },
      {
        source: "/changelog",
        destination: "/changelog/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/changelog/notra",
        destination: "/changelog/notra/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/changelog/notra/:slug",
        destination: "/changelog/notra/:slug/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/changelog.md",
        destination: "/changelog/markdown",
      },
      {
        source: "/changelog/markdown",
        destination: "/changelog/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/changelog/notra.md",
        destination: "/changelog/notra/markdown",
      },
      {
        source: "/changelog/notra/markdown",
        destination: "/changelog/notra/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/changelog/notra/:slug.md",
        destination: "/changelog/notra/:slug/markdown",
      },
      {
        source: "/changelog/notra/:slug/markdown",
        destination: "/changelog/notra/:slug/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/changelog/:name/markdown",
        destination: "/changelog/:name/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/changelog/:name",
        destination: "/changelog/:name/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/changelog/:name.md",
        destination: "/changelog/:name/markdown",
      },
      {
        source: "/changelog/:name/:slug/markdown",
        destination: "/changelog/:name/:slug/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/changelog/:name/:slug",
        destination: "/changelog/:name/:slug/markdown",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*text/markdown.*",
          },
        ],
      },
      {
        source: "/changelog/:name/:slug.md",
        destination: "/changelog/:name/:slug/markdown",
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
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' databuddy.cc *.databuddy.cc",
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self'",
            "img-src 'self' data: blob: databuddy.cc *.databuddy.cc",
            "connect-src 'self' databuddy.cc *.databuddy.cc",
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
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
