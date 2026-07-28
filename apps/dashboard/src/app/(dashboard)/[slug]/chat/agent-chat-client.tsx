"use client";

import { SentIcon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@notra/ui/components/ai-elements/message";
import { Button } from "@notra/ui/components/ui/button";
import type { EveMessage, EveMessageInputRequest } from "eve/react";
import { useEveAgent } from "eve/react";
import { useState } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";

function getPendingInputRequest(
  messages: readonly EveMessage[]
): EveMessageInputRequest | null {
  const lastMessage = messages.at(-1);
  if (!lastMessage) {
    return null;
  }
  for (const part of lastMessage.parts) {
    if (
      part.type === "dynamic-tool" &&
      part.toolMetadata?.eve?.inputRequest &&
      part.state !== "output-available"
    ) {
      return part.toolMetadata.eve.inputRequest;
    }
  }
  return null;
}

function AgentMessagePart({ part }: { part: EveMessage["parts"][number] }) {
  if (part.type === "text") {
    return <MessageResponse>{part.text}</MessageResponse>;
  }
  if (part.type === "reasoning") {
    return <p className="text-muted-foreground text-sm italic">{part.text}</p>;
  }
  if (part.type === "dynamic-tool") {
    return (
      <p className="rounded-md border px-2 py-1 font-mono text-muted-foreground text-xs">
        {part.toolName}
      </p>
    );
  }
  return null;
}

export default function AgentChatClient({
  organizationSlug,
}: {
  organizationSlug: string;
}) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : getOrganization(organizationSlug);
  const organizationId = organization?.id ?? "";

  const agent = useEveAgent({
    host: `/api/organizations/${organizationId}/agent`,
    headers: { "x-agent-surface": "standalone-chat" },
  });
  const [draft, setDraft] = useState("");
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const pendingInputRequest = getPendingInputRequest(agent.data.messages);

  if (!organizationId) {
    return null;
  }

  const submitDraft = () => {
    const message = draft.trim();
    if (message.length === 0 || isBusy) {
      return;
    }
    setDraft("");
    agent.send({ message }).catch(() => {
      setDraft(message);
    });
  };

  const respondToInputRequest = (optionId: string) => {
    if (!pendingInputRequest) {
      return;
    }
    agent
      .send({
        inputResponses: [
          { requestId: pendingInputRequest.requestId, optionId },
        ],
      })
      .catch((error) => {
        console.error("[agent-chat] Input response failed", error);
      });
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4 p-4">
      <div className="flex-1 space-y-4 overflow-y-auto">
        {agent.data.messages.map((message) => (
          <Message from={message.role} key={message.id}>
            <MessageContent>
              {message.parts.map((part, index) => (
                <AgentMessagePart
                  key={`${message.id}-${String(index)}`}
                  part={part}
                />
              ))}
            </MessageContent>
          </Message>
        ))}
        {agent.error ? (
          <p className="text-destructive text-sm">{agent.error.message}</p>
        ) : null}
      </div>

      {pendingInputRequest ? (
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <p className="flex-1 text-sm">{pendingInputRequest.prompt}</p>
          {(pendingInputRequest.options ?? []).map((option) => (
            <Button
              key={option.id}
              onClick={() => respondToInputRequest(option.id)}
              size="sm"
              variant={option.id === "approve" ? "default" : "outline"}
            >
              {option.label ?? option.id}
            </Button>
          ))}
        </div>
      ) : null}

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submitDraft();
        }}
      >
        <textarea
          className="min-h-[3rem] flex-1 resize-none rounded-lg border bg-background p-3 text-sm outline-none focus-visible:ring-1"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submitDraft();
            }
          }}
          placeholder="Message your Notra agent"
          value={draft}
        />
        {isBusy ? (
          <Button onClick={() => agent.stop()} type="button" variant="outline">
            <HugeiconsIcon icon={StopIcon} />
          </Button>
        ) : (
          <Button disabled={draft.trim().length === 0} type="submit">
            <HugeiconsIcon icon={SentIcon} />
          </Button>
        )}
      </form>
    </div>
  );
}
