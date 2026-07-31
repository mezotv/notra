"use client";

import { Slack } from "@notra/ui/components/ui/svgs/slack";
import type { SlackRelayInputMode } from "@/types/slack-relay";

export function SlackRelayFooterNotice({ threadUrl }: SlackRelayInputMode) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-1.5 text-muted-foreground text-xs">
      <Slack className="size-3.5 shrink-0" />
      <span className="truncate">
        This chat is a Slack thread. Replies are sent to Slack as you.
      </span>
      {threadUrl && (
        <a
          className="shrink-0 font-medium text-foreground underline-offset-2 hover:underline"
          href={threadUrl}
          rel="noopener"
          target="_blank"
        >
          Open in Slack
        </a>
      )}
    </div>
  );
}
