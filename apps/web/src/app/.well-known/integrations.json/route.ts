import { jsonResponse } from "@/utils/http";
import { buildIntegrationsManifest } from "@/utils/integrations-manifest";

export function GET() {
  return jsonResponse(buildIntegrationsManifest(), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "cache-control": "public, max-age=3600",
    },
  });
}
