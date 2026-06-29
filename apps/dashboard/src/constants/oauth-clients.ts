export const OAUTH_CLIENT_BRANDS = [
  { id: "codex", label: "Codex", keywords: ["codex", "chatgpt"] },
  { id: "claude", label: "Claude", keywords: ["claude"] },
  { id: "hermes", label: "Hermes", keywords: ["hermes"] },
  { id: "openclaw", label: "OpenClaw", keywords: ["openclaw", "open claw"] },
] as const;

export type OAuthClientBrandId = (typeof OAUTH_CLIENT_BRANDS)[number]["id"];
