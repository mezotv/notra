import { jsonResponse } from "@/utils/http";
import { DOCS_URL, MCP_URL } from "@/utils/urls";

export function GET() {
  return jsonResponse(
    {
      name: "Notra MCP",
      version: "1.0.0",
      transport: "streamable-http",
      endpoint: MCP_URL,
      documentation: `${DOCS_URL}/devtools/mcp`,
      instructions:
        "Use Notra MCP after authenticating with a Notra API key. The server exposes tools for reading organization content, generating drafts, and applying saved brand voice guidance.",
      authentication: {
        type: "bearer",
        resource_metadata:
          "https://api.usenotra.com/.well-known/oauth-protected-resource",
      },
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "cache-control": "public, max-age=3600",
      },
    }
  );
}
