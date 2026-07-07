"use client";

import { MessageResponse } from "@notra/ui/components/ai-elements/message";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { ChatToolBlock } from "@/components/ai/chat-tool-block";
import { getToolOutput } from "@/lib/debug/eve-messages";
import type { EveMessagePartProps } from "@/types/debug";

export function EveMessagePart({ part, onRespond }: EveMessagePartProps) {
  if (part.type === "text") {
    return <MessageResponse>{part.text}</MessageResponse>;
  }

  if (part.type === "reasoning") {
    return (
      <Collapsible>
        <CollapsibleTrigger className="text-muted-foreground text-xs underline-offset-2 hover:underline">
          Reasoning
        </CollapsibleTrigger>
        <CollapsibleContent>
          <MessageResponse className="text-muted-foreground text-sm">
            {part.text}
          </MessageResponse>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  if (part.type === "authorization") {
    return (
      <p className="text-muted-foreground text-xs">
        Authorization {part.state}: {part.displayName}
      </p>
    );
  }

  if (part.type === "dynamic-tool") {
    const inputRequest = part.toolMetadata?.eve?.inputRequest;
    const needsResponse =
      part.state === "approval-requested" && inputRequest !== undefined;
    const approveId =
      inputRequest?.options?.find((option) => option.style === "primary")?.id ??
      inputRequest?.options?.[0]?.id ??
      "approve";
    const denyId =
      inputRequest?.options?.find((option) => option.style === "danger")?.id ??
      inputRequest?.options?.at(-1)?.id ??
      "deny";

    return (
      <ChatToolBlock
        input={part.input}
        onApprove={
          needsResponse
            ? () => onRespond(inputRequest.requestId, approveId)
            : undefined
        }
        onDeny={
          needsResponse
            ? () => onRespond(inputRequest.requestId, denyId)
            : undefined
        }
        output={getToolOutput(part)}
        state={part.state}
        toolMetadata={part.toolMetadata}
        toolName={part.toolName}
      />
    );
  }

  return null;
}
