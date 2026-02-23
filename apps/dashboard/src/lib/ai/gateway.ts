import { createGateway } from "@ai-sdk/gateway";
import type {
  GatewayArgs,
  GatewayClient,
  GatewayResult,
} from "@/types/lib/ai/gateway";

const headers = {
  "http-referer": "https://www.usenotra.com",
  "x-title": "Notra",
};

let gatewayClient: GatewayClient | null = null;

function getGatewayClient(): GatewayClient {
  if (gatewayClient) {
    return gatewayClient;
  }

  gatewayClient = createGateway({ headers });
  return gatewayClient;
}

export const gateway = (...args: GatewayArgs): GatewayResult => {
  const client = getGatewayClient();
  return client(...args);
};
