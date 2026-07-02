import { SITE_DESCRIPTION } from "@/utils/metadata";
import { SOCIAL_LINKS } from "@/utils/social-links";
import { API_URL, APP_URL, DOCS_URL, MCP_URL, SITE_URL } from "@/utils/urls";

const AGENT_DISCOVERY_PATHS = {
  agentJson: "/.well-known/agent.json",
  agentCard: "/.well-known/agent-card.json",
  apiCatalog: "/.well-known/api-catalog",
  authMarkdown: "/auth.md",
  botAuthDirectory: "/.well-known/http-message-signatures-directory",
  mcp: "/.well-known/mcp",
  oauthProtectedResource: "/.well-known/oauth-protected-resource",
  schemaMap: "/schema-map.xml",
} as const;

export const NOTRA_CONTACT_EMAIL = "hello@usenotra.com";
export const NOTRA_SUPPORT_EMAIL = "support@usenotra.com";

export const NOTRA_SAME_AS = [
  SOCIAL_LINKS.github,
  SOCIAL_LINKS.x,
  SOCIAL_LINKS.linkedin,
  SOCIAL_LINKS.youtube,
  SOCIAL_LINKS.reddit,
] as const;

const PUBLIC_API_SCOPES = [
  "offline_access",
  "posts.read",
  "posts.write",
  "brand-identities.read",
  "brand-identities.write",
  "integrations.read",
  "integrations.write",
  "schedules.read",
  "schedules.write",
  "event-triggers.read",
  "event-triggers.write",
  "chats.read",
  "chats.write",
  "skills.read",
  "skills.write",
] as const;

export const NOTRA_CAPABILITIES = [
  "Generate changelog entries from shipped product work",
  "Draft launch posts, blog posts, and social updates in a saved brand voice",
  "Read and manage generated posts through the Notra API",
  "Use Notra MCP tools for authenticated content workflows",
] as const;

export function siteUrl(path = "") {
  return `${SITE_URL}${path}`;
}

export function apiUrl(path = "") {
  return `${API_URL}${path}`;
}

function appUrl(path = "") {
  return `${APP_URL}${path}`;
}

function authIssuerUrl() {
  return appUrl("/api/auth");
}

export function buildAgentAuthMetadata() {
  return {
    register_uri: appUrl("/agent/auth/register"),
    claim_uri: siteUrl("/agent/auth/claim"),
    revocation_uri: appUrl("/agent/auth/revoke"),
    skill: siteUrl(AGENT_DISCOVERY_PATHS.authMarkdown),
    identity_types_supported: ["anonymous", "identity_assertion"],
    anonymous: {
      credential_types_supported: ["api_key"],
    },
    identity_assertion: {
      assertion_types_supported: [
        "verified_email",
        "urn:ietf:params:oauth:token-type:id-jag",
      ],
      credential_types_supported: ["api_key", "bearer"],
    },
  };
}

export function buildProtectedResourceMetadata() {
  return {
    resource: apiUrl(),
    authorization_servers: [authIssuerUrl()],
    scopes_supported: PUBLIC_API_SCOPES,
    bearer_methods_supported: ["header"],
    resource_documentation: siteUrl(AGENT_DISCOVERY_PATHS.authMarkdown),
  };
}

export function buildAgentJson() {
  return {
    name: "Notra",
    title: "Notra Agent Discovery",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    icon: siteUrl("/notra-mark.svg"),
    category: "AI content generation",
    docs: DOCS_URL,
    api: {
      base_url: API_URL,
      openapi: apiUrl("/openapi.json"),
      catalog: siteUrl(AGENT_DISCOVERY_PATHS.apiCatalog),
      auth: siteUrl(AGENT_DISCOVERY_PATHS.authMarkdown),
      sandbox: apiUrl("/v1/status?sandbox=true"),
    },
    mcp: {
      streamable_http: MCP_URL,
      webmcp: siteUrl(AGENT_DISCOVERY_PATHS.mcp),
      docs: `${DOCS_URL}/devtools/mcp`,
    },
    capabilities: NOTRA_CAPABILITIES,
    auth: buildAgentAuthMetadata(),
    contact: {
      email: NOTRA_CONTACT_EMAIL,
      support: NOTRA_SUPPORT_EMAIL,
    },
    sameAs: NOTRA_SAME_AS,
  };
}
