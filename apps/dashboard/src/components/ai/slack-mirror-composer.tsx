"use client";

import { Button } from "@notra/ui/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { relaySlackMirrorMessage } from "@/lib/chat/slack-relay";
import type { SlackMirrorComposerProps } from "@/types/slack-relay";

export function SlackMirrorComposer({
  organizationId,
  chatId,
  onSent,
}: SlackMirrorComposerProps) {
  const [text, setText] = useState("");

  const relayMutation = useMutation({
    mutationFn: (value: string) =>
      relaySlackMirrorMessage(organizationId, chatId, value),
    onSuccess: (message) => {
      setText("");
      onSent(message);
    },
  });

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !relayMutation.isPending;

  const handleSend = () => {
    if (!canSend) {
      return;
    }
    relayMutation.mutate(trimmed);
  };

  return (
    <div className="rounded-2xl border border-border bg-background p-2 shadow-2xs">
      <textarea
        aria-label="Reply in the Slack thread"
        className="max-h-40 min-h-16 w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
        placeholder="Reply in this Slack thread..."
        value={text}
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-1">
        <span className="text-muted-foreground text-xs">
          {relayMutation.isError
            ? "Sending failed. Try again."
            : "Sent to the Slack thread as you"}
        </span>
        <Button
          disabled={!canSend}
          onClick={handleSend}
          size="sm"
          type="button"
        >
          {relayMutation.isPending ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            "Send"
          )}
        </Button>
      </div>
    </div>
  );
}
