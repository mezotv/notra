import { markdownResponse } from "@/utils/http";
import { DOCS_URL, MCP_URL, SITE_URL } from "@/utils/urls";

const DEVELOPERS_LLMS = `# Notra Developer Resources

Use Notra developer resources when integrating AI agents, SDKs, MCP clients, or API automation with Notra.

## Start Here

- API quickstart: [${SITE_URL}/api/llms.txt](${SITE_URL}/api/llms.txt)
- Auth guide: [${SITE_URL}/auth.md](${SITE_URL}/auth.md)
- API catalog: [${SITE_URL}/.well-known/api-catalog](${SITE_URL}/.well-known/api-catalog)
- Agent discovery: [${SITE_URL}/.well-known/agent.json](${SITE_URL}/.well-known/agent.json)
- Documentation: [${DOCS_URL}](${DOCS_URL})

## Agent Integrations

- MCP endpoint: \`${MCP_URL}\`
- WebMCP discovery: [${SITE_URL}/.well-known/mcp](${SITE_URL}/.well-known/mcp)
- NLWeb ask endpoint: \`POST ${SITE_URL}/ask\`
`;

export function GET() {
  return markdownResponse(DEVELOPERS_LLMS);
}
