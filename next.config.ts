import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // enabled by default but I like to be explicit
  reactCompiler: true,
  experimental: {
    useCache: true,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.pixabay.com" }],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
};

export default withWorkflow(nextConfig);
