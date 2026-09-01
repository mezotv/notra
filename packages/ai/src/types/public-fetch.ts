import type { Agent } from "undici/index.js";

export interface PublicFetchRequestInit extends RequestInit {
  dispatcher: Agent;
  duplex: "half";
}

export interface PublicFetchOptions {
  maxRedirects?: number;
  timeoutMs?: number;
}
