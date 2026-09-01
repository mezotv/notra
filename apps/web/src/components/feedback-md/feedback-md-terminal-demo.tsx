import { ClaudeHeader } from "@notra/ui/components/brainless/claude/claude-header";
import { ClaudeMessage } from "@notra/ui/components/brainless/claude/claude-message";
import { ClaudePrompt } from "@notra/ui/components/brainless/claude/claude-prompt";
import { ClaudeTodoList } from "@notra/ui/components/brainless/claude/claude-todo-list";
import { ClaudeToolCall } from "@notra/ui/components/brainless/claude/claude-tool-call";

import {
  FEEDBACK_MD_TERMINAL_ASSISTANT_MESSAGE,
  FEEDBACK_MD_TERMINAL_HEADER,
  FEEDBACK_MD_TERMINAL_PROMPT_PLACEHOLDER,
  FEEDBACK_MD_TERMINAL_RESULT_MESSAGE,
  FEEDBACK_MD_TERMINAL_TITLE,
  FEEDBACK_MD_TERMINAL_TODOS,
  FEEDBACK_MD_TERMINAL_TOOL_CALLS,
  FEEDBACK_MD_TERMINAL_USER_MESSAGE,
} from "@/lib/feedback-md/constants";

export function FeedbackMdTerminalDemo() {
  return (
    <div className="flex w-full flex-col overflow-clip rounded-[1.25rem] bg-[#1E1E1E] [box-shadow:#28282833_0rem_1.5rem_3.5rem_-1rem]">
      <div className="flex items-center gap-3 bg-[#282828] px-4.5 py-3">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 shrink-0 rounded-full bg-[#4A4A4A]" />
          <div className="size-2.5 shrink-0 rounded-full bg-[#4A4A4A]" />
          <div className="size-2.5 shrink-0 rounded-full bg-[#4A4A4A]" />
        </div>
        <span className="font-mono text-[0.75rem] leading-4 text-[#FFFFFF66]">
          {FEEDBACK_MD_TERMINAL_TITLE}
        </span>
      </div>
      <div className="flex flex-col gap-3.5 p-4 sm:p-6">
        <ClaudeHeader
          cwd={FEEDBACK_MD_TERMINAL_HEADER.cwd}
          model={FEEDBACK_MD_TERMINAL_HEADER.model}
          org={FEEDBACK_MD_TERMINAL_HEADER.org}
          tips={FEEDBACK_MD_TERMINAL_HEADER.tips}
          user={FEEDBACK_MD_TERMINAL_HEADER.user}
          version={FEEDBACK_MD_TERMINAL_HEADER.version}
          whatsNew={FEEDBACK_MD_TERMINAL_HEADER.whatsNew}
        />
        <ClaudeMessage className="mt-1 rounded-sm px-2.5 py-1.5" from="user">
          {FEEDBACK_MD_TERMINAL_USER_MESSAGE}
        </ClaudeMessage>
        <ClaudeMessage>{FEEDBACK_MD_TERMINAL_ASSISTANT_MESSAGE}</ClaudeMessage>
        <ClaudeTodoList todos={FEEDBACK_MD_TERMINAL_TODOS} />
        <div className="flex flex-col gap-2">
          {FEEDBACK_MD_TERMINAL_TOOL_CALLS.map((call) => (
            <ClaudeToolCall
              arg={call.arg}
              key={call.tool}
              result={call.result}
              status={call.status}
              tool={call.tool}
            />
          ))}
        </div>
        <ClaudeMessage>{FEEDBACK_MD_TERMINAL_RESULT_MESSAGE}</ClaudeMessage>
        <ClaudePrompt
          className="mt-1"
          effort={false}
          mode="bypass"
          placeholder={FEEDBACK_MD_TERMINAL_PROMPT_PLACEHOLDER}
        />
      </div>
    </div>
  );
}
