import Zernio from "@zernio/node";

let client: Zernio | null = null;

export function isSocialConnectConfigured(): boolean {
  return Boolean(process.env.ZERNIO_API_KEY);
}

export function getSocialConnectClient(): Zernio {
  if (!isSocialConnectConfigured()) {
    throw new Error("Social account linking is not configured");
  }
  client ??= new Zernio();
  return client;
}
