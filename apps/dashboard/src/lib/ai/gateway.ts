import { createGateway } from "@ai-sdk/gateway";

const headers = {
  "http-referer": "https://www.usenotra.com",
  "x-title": "Notra",
};

type GatewayClient = ReturnType<typeof createGateway>;

let gatewayClient: GatewayClient | null = null;

function getGatewayClient(): GatewayClient {
  if (gatewayClient) {
    return gatewayClient;
  }

  gatewayClient = createGateway({ headers });
  return gatewayClient;
}

type GatewayArgs = Parameters<GatewayClient>;
type GatewayResult = ReturnType<GatewayClient>;

export const gateway = (...args: GatewayArgs): GatewayResult => {
  const client = getGatewayClient();
  return client(...args);
};
