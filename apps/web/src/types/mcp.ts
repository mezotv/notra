export interface McpClient {
  id: "claude-code" | "codex" | "cursor" | "hermes" | "crush";
  label: string;
  iconSrc: string;
  invertInDark: boolean;
  command: string;
}

export interface McpToolCard {
  name: string;
  description: string;
}

export interface McpTerminalToolCall {
  tool: string;
  arg: string;
  result: string;
}

export interface McpCommandTabsProps {
  className?: string;
}
