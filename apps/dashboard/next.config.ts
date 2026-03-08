import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // enabled by default but I like to be explicit
  reactCompiler: true,
  outputFileTracingIncludes: {
    "/*": ["./src/lib/ai/skills/**/*"],
  },
  experimental: {
    useCache: true,
    optimizePackageImports: ["@hugeicons/core-free-icons", "lucide-react"],
  },
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  transpilePackages: ["@notra/db", "@notra/ui", "@notra/email"],
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
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' cal.com app.cal.com va.vercel-scripts.com databuddy.cc *.databuddy.cc",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      [
        "img-src 'self' data: blob:",
        "api.dicebear.com",
        "icons.duckduckgo.com",
        "pbs.twimg.com",
        "avatars.githubusercontent.com",
        "databuddy.cc",
        "*.databuddy.cc",
        process.env.CLOUDFLARE_PUBLIC_URL
          ? new URL(process.env.CLOUDFLARE_PUBLIC_URL).hostname
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      "connect-src 'self' databuddy.cc *.databuddy.cc",
      "frame-src 'self' cal.com app.cal.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ];

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
          {
            key: "Content-Security-Policy",
            value: cspDirectives.join("; "),
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
