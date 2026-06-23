import {
  buildAgentJson,
  NOTRA_CAPABILITIES,
  siteUrl,
} from "@/utils/agent-metadata";
import { jsonResponse } from "@/utils/http";

export function GET() {
  const agent = buildAgentJson();

  return jsonResponse({
    name: "Notra",
    description: agent.description,
    url: agent.url,
    version: "1.0.0",
    provider: {
      organization: "Notra",
      url: agent.url,
    },
    documentationUrl: agent.docs,
    iconUrl: agent.icon,
    contactUrl: siteUrl("/contact"),
    endpoints: {
      api: agent.api.base_url,
      openapi: agent.api.openapi,
      mcp: agent.mcp.streamable_http,
      webmcp: agent.mcp.webmcp,
      auth: agent.api.auth,
    },
    capabilities: NOTRA_CAPABILITIES,
    skills: [
      {
        id: "content_generation",
        name: "Generate product content",
        description:
          "Turn shipped engineering work into changelogs, launch posts, blog posts, and social updates.",
        inputModes: ["application/json", "text/plain"],
        outputModes: ["application/json", "text/markdown", "text/html"],
      },
      {
        id: "brand_voice",
        name: "Apply brand voice",
        description:
          "Use saved writing references to match a team's tone, vocabulary, and cadence.",
        inputModes: ["application/json", "text/markdown"],
        outputModes: ["text/markdown", "text/html"],
      },
    ],
  });
}
