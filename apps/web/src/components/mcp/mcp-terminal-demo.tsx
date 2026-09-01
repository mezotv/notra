import { ClaudeHeader } from "@notra/ui/components/brainless/claude/claude-header";
import { ClaudeMessage } from "@notra/ui/components/brainless/claude/claude-message";
import { ClaudePrompt } from "@notra/ui/components/brainless/claude/claude-prompt";
import { ClaudeTodoList } from "@notra/ui/components/brainless/claude/claude-todo-list";
import { ClaudeToolCall } from "@notra/ui/components/brainless/claude/claude-tool-call";

import {
  MCP_TERMINAL_ASSISTANT_MESSAGE,
  MCP_TERMINAL_HEADER,
  MCP_TERMINAL_PROMPT_PLACEHOLDER,
  MCP_TERMINAL_RESULT_MESSAGE,
  MCP_TERMINAL_TITLE,
  MCP_TERMINAL_TODOS,
  MCP_TERMINAL_TOOL_CALLS,
  MCP_TERMINAL_USER_MESSAGE,
  MCP_TERMINAL_WHATS_NEW_STATIC,
} from "@/constants/mcp";
import type { McpTerminalDemoProps } from "@/types/mcp";
import { formatMcpWhatsNewDiscovery } from "@/utils/mcp";

export function McpTerminalDemo({ toolCount }: McpTerminalDemoProps) {
  return (
    <div className="flex w-full flex-col overflow-clip rounded-[1.25rem] bg-[#1E1E1E] [box-shadow:#28282833_0rem_1.5rem_3.5rem_-1rem]">
      <div className="flex items-center gap-3 bg-[#282828] px-4.5 py-3">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 shrink-0 rounded-full bg-[#4A4A4A]" />
          <div className="size-2.5 shrink-0 rounded-full bg-[#4A4A4A]" />
          <div className="size-2.5 shrink-0 rounded-full bg-[#4A4A4A]" />
        </div>
        <span className="font-mono text-[0.75rem] leading-4 text-[#FFFFFF66]">
          {MCP_TERMINAL_TITLE}
        </span>
      </div>
      <div className="flex flex-col gap-3.5 p-4 sm:p-6">
        <ClaudeHeader
          cwd={MCP_TERMINAL_HEADER.cwd}
          model={MCP_TERMINAL_HEADER.model}
          org={MCP_TERMINAL_HEADER.org}
          tips={MCP_TERMINAL_HEADER.tips}
          user={MCP_TERMINAL_HEADER.user}
          version={MCP_TERMINAL_HEADER.version}
          whatsNew={[
            formatMcpWhatsNewDiscovery(toolCount),
            MCP_TERMINAL_WHATS_NEW_STATIC,
          ]}
        />
        <ClaudeMessage className="mt-1 rounded-sm px-2.5 py-1.5" from="user">
          {MCP_TERMINAL_USER_MESSAGE}
        </ClaudeMessage>
        <ClaudeMessage>{MCP_TERMINAL_ASSISTANT_MESSAGE}</ClaudeMessage>
        <ClaudeTodoList todos={MCP_TERMINAL_TODOS} />
        <div className="flex flex-col gap-2">
          {MCP_TERMINAL_TOOL_CALLS.map((call) => (
            <ClaudeToolCall
              arg={call.arg}
              key={call.tool}
              result={call.result}
              tool={call.tool}
            />
          ))}
        </div>
        <ClaudeMessage>{MCP_TERMINAL_RESULT_MESSAGE}</ClaudeMessage>
        <ClaudePrompt
          className="mt-1"
          effort={false}
          mode="bypass"
          placeholder={MCP_TERMINAL_PROMPT_PLACEHOLDER}
        />
      </div>
    </div>
  );
}
