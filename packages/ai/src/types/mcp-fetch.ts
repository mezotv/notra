import type { Agent } from "undici";

export interface McpDispatcherRequestInit extends RequestInit {
  dispatcher: Agent;
}
