import { buildOAuthAuthorizationServerMetadata } from "@/lib/oauth/metadata";

export function GET() {
  return Response.json(buildOAuthAuthorizationServerMetadata(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
