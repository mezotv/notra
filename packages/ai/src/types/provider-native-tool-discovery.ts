import type { StreamProviderOptions } from "@notra/ai/types/orchestration";
import type { Tool } from "ai";

export type ProviderNativeToolDiscoveryProvider = "openai" | "anthropic";

export interface ProviderNativeToolDiscoverySupport {
  provider: ProviderNativeToolDiscoveryProvider;
  supportsToolSearch: boolean;
  supportsNativeMcp: boolean;
}

export interface ProviderNativeToolRuntime {
  provider: ProviderNativeToolDiscoveryProvider;
  tools: Record<string, Tool>;
  descriptions: string[];
}

export interface ProviderNativeMcpRuntime {
  handled: boolean;
  tools: Record<string, Tool>;
  providerOptions?: StreamProviderOptions;
  descriptions: string[];
}

export type ToolWithProviderOptions = Tool & {
  providerOptions?: Record<string, unknown>;
};

export interface OpenAINamespace extends Record<string, string> {
  name: string;
  description: string;
}

export interface AnthropicNativeMcpServer {
  type: "url";
  name: string;
  url: string;
  authorizationToken?: string;
  toolConfiguration: { enabled: true };
}
