import type { RouterPolicyConfig } from "@notra/ai/router/types";

export const ROUTER_POLICY = {
  defaultGateway: "openrouter",
  paidGateway: "vercel",
  freeGateway: "openrouter",
  allowNonZdr: false,
  crossGatewayFallback: true,
} satisfies RouterPolicyConfig;
