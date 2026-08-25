import {
  AGENT_FEEDBACK_API_BASE_URL,
  AGENT_FEEDBACK_API_PATH,
  AGENT_FEEDBACK_API_URL_ENV,
  AGENT_FEEDBACK_DOCS_URL,
  AGENT_FEEDBACK_PACKAGE,
  AGENT_FEEDBACK_PACKAGE_ENTRY,
  AGENT_FEEDBACK_TOKEN_ENV,
} from "@/constants/agent-feedback";
import type {
  AgentFeedbackSetupResponse,
  AgentFeedbackSetupSnippets,
  AgentFeedbackTokenResult,
} from "@/types/agent-feedback";

const TRAILING_SLASHES_REGEX = /\/+$/;

function resolveApiBaseUrl(): string {
  const override = process.env[AGENT_FEEDBACK_API_URL_ENV]?.trim();
  const base =
    override && override.length > 0 ? override : AGENT_FEEDBACK_API_BASE_URL;
  return base.replace(TRAILING_SLASHES_REGEX, "");
}

function isApiBaseOverridden(): boolean {
  return resolveApiBaseUrl() !== AGENT_FEEDBACK_API_BASE_URL;
}

function resolveApiUrl(): string {
  return `${resolveApiBaseUrl()}${AGENT_FEEDBACK_API_PATH}`;
}

function buildPromptSnippet(result: AgentFeedbackTokenResult): string {
  return [
    `Add a feedback tool to our MCP server so AI agents using ${result.organizationName} can send bugs, feature requests, questions and praise to our Notra inbox.`,
    "",
    `1. Install ${AGENT_FEEDBACK_PACKAGE} with the project's package manager.`,
    `2. Where the McpServer is created, call registerFeedbackTool(server, { token: process.env.${AGENT_FEEDBACK_TOKEN_ENV}!, productName: ${JSON.stringify(result.organizationName)}${isApiBaseOverridden() ? `, endpoint: ${JSON.stringify(resolveApiBaseUrl())}` : ""} }) from "${AGENT_FEEDBACK_PACKAGE_ENTRY}". It registers a submit_feedback tool that accepts message, title, kind (bug | feature | praise | question | other), sentiment (negative | neutral | positive) and contextUrl.`,
    `3. Add ${AGENT_FEEDBACK_TOKEN_ENV}=${result.token} to the server's environment (.env.example, deployment config and secrets). It is a write-only token: it can only submit feedback.`,
    `4. If the server does not use @modelcontextprotocol/sdk, register an equivalent tool that POSTs JSON to ${resolveApiUrl()} with header "Authorization: Bearer $${AGENT_FEEDBACK_TOKEN_ENV}" and a body of { message, title?, kind?, sentiment?, contextUrl?, agentClient? }. Only message is required; Notra fills in title, kind and sentiment when they are missing. The API answers 202 with the stored feedback.`,
    "5. Mention the tool in the server instructions so agents know they can use it when a user hits a problem or asks for something we do not support.",
    "",
    `Docs: ${AGENT_FEEDBACK_DOCS_URL}`,
  ].join("\n");
}

function buildMcpSnippet(productName: string): string {
  return [
    'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";',
    `import { registerFeedbackTool } from "${AGENT_FEEDBACK_PACKAGE_ENTRY}";`,
    "",
    "const server = new McpServer({",
    `  name: ${JSON.stringify(productName)},`,
    '  version: "1.0.0",',
    "});",
    "",
    "registerFeedbackTool(server, {",
    `  token: process.env.${AGENT_FEEDBACK_TOKEN_ENV}!,`,
    `  productName: ${JSON.stringify(productName)},`,
    ...(isApiBaseOverridden()
      ? [`  endpoint: ${JSON.stringify(resolveApiBaseUrl())},`]
      : []),
    "});",
  ].join("\n");
}

function buildFetchSnippet(productName: string): string {
  return [
    'import * as z from "zod";',
    "",
    "server.registerTool(",
    '  "submit_feedback",',
    "  {",
    `    description: ${JSON.stringify(`Send feedback about ${productName} to the team: bugs, feature requests, questions or praise.`)},`,
    "    inputSchema: {",
    "      message: z.string().min(1).max(4000),",
    '      kind: z.enum(["bug", "feature", "praise", "question", "other"]).optional(),',
    '      sentiment: z.enum(["negative", "neutral", "positive"]).optional(),',
    "      contextUrl: z.string().url().optional(),",
    "    },",
    "  },",
    "  async (input) => {",
    `    const response = await fetch("${resolveApiUrl()}", {`,
    '      method: "POST",',
    "      headers: {",
    '        "content-type": "application/json",',
    `        authorization: \`Bearer \${process.env.${AGENT_FEEDBACK_TOKEN_ENV}}\`,`,
    "      },",
    "      body: JSON.stringify(input),",
    "    });",
    "    return {",
    "      content: [",
    "        {",
    '          type: "text",',
    "          text: response.ok",
    '            ? "Thanks, the feedback was sent to the team."',
    '            : "Feedback could not be submitted.",',
    "        },",
    "      ],",
    "      isError: !response.ok,",
    "    };",
    "  }",
    ");",
  ].join("\n");
}

function buildCurlSnippet(token: string): string {
  return [
    `curl -X POST ${resolveApiUrl()} \\`,
    `  -H "Authorization: Bearer ${token}" \\`,
    '  -H "Content-Type: application/json" \\',
    "  -d '{",
    '    "message": "The search tool times out when the query has quotes.",',
    '    "contextUrl": "https://docs.example.com/search"',
    "  }'",
  ].join("\n");
}

function buildAgentFeedbackSnippets(
  result: AgentFeedbackTokenResult
): AgentFeedbackSetupSnippets {
  return {
    mcp: buildMcpSnippet(result.organizationName),
    fetch: buildFetchSnippet(result.organizationName),
    curl: buildCurlSnippet(result.token),
  };
}

export function buildAgentFeedbackSetup(
  result: AgentFeedbackTokenResult
): AgentFeedbackSetupResponse {
  return {
    apiUrl: resolveApiUrl(),
    token: result.token,
    prompt: buildPromptSnippet(result),
    snippets: buildAgentFeedbackSnippets(result),
  };
}
