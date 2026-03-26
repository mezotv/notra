import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // enabled by default but I like to be explicit
  reactCompiler: true,
  outputFileTracingIncludes: {
    "/*": ["./src/lib/ai/skills/**/*", "../../packages/ai/src/skills/**/*"],
  },
  experimental: {
    useCache: true,
    optimizePackageImports: ["@hugeicons/core-free-icons", "lucide-react"],
  },
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  transpilePackages: [
    "@notra/db",
    "@notra/ui",
    "@notra/email",
    "@notra/ai",
    "@notra/content-generation",
  ],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/:slug/settings",
        destination: "/:slug/settings/general",
        permanent: true,
      },
      {
        source: "/:slug/schedules",
        destination: "/:slug/automation/schedules",
        permanent: true,
      },
      {
        source: "/:slug/automation/schedule",
        destination: "/:slug/automation/schedules",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
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
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "icons.duckduckgo.com",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      ...(process.env.CLOUDFLARE_PUBLIC_URL
        ? [
            {
              protocol: new URL(
                process.env.CLOUDFLARE_PUBLIC_URL
              ).protocol.replace(":", "") as "https" | "http",
              hostname: new URL(process.env.CLOUDFLARE_PUBLIC_URL).hostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
