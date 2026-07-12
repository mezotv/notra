import type { Agent } from "undici/index.js";

export interface McpDispatcherRequestInit extends RequestInit {
  dispatcher: Agent;
  duplex: "half";
}
