import type { createGateway } from "ai";

export type GatewayClient = ReturnType<typeof createGateway>;

export type GatewayArgs = Parameters<GatewayClient>;
export type GatewayResult = ReturnType<GatewayClient>;
