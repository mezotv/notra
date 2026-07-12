export interface StreamEvent {
  data?: Record<string, unknown>;
  type: string;
}

export interface StreamAction {
  callId: string;
  input?: unknown;
  kind: string;
  name: string;
  output?: unknown;
  status: string;
}

export interface StreamReport {
  actions: StreamAction[];
  agentName: string;
  events: StreamEvent[];
  finalMessage?: string;
  modelId: string;
  receivedMessage?: string;
  reasoning: string[];
  sessionId: string;
  usage: {
    cacheReadTokens: number;
    inputTokens: number;
    outputTokens: number;
  };
}
