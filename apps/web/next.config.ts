import path from "node:path";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname, "../.."),
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
        source: "/changelog/:name.md",
        destination: "/changelog/:name/markdown",
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
    {
      source: "/founder-call",
      destination: "https://cal.com/dominikkoch",
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
      ],
    },
  ],
  images: {
    unoptimized: true,
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
