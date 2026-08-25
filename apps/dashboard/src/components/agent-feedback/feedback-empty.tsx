"use client";

import { AgentFeedbackSetup } from "@/components/agent-feedback/feedback-setup";
import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import {
  EMPTY_STATE_TABLE_COLUMNS,
  EMPTY_STATE_TABLE_ROWS,
} from "@/constants/empty-state";
import { useAgentFeedbackSetup } from "@/lib/hooks/use-agent-feedback";
import type { AgentFeedbackEmptyProps } from "@/types/agent-feedback";

export function AgentFeedbackEmpty({
  organizationId,
}: AgentFeedbackEmptyProps) {
  const { data: setup } = useAgentFeedbackSetup(organizationId);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 select-none px-3 pt-3 sm:px-4 sm:pt-4"
      >
        <div className="mask-[linear-gradient(to_bottom,black_0%,transparent_100%)] opacity-[0.38]">
          <EmptyStateTablePreview
            columns={EMPTY_STATE_TABLE_COLUMNS.feedback}
            rows={EMPTY_STATE_TABLE_ROWS}
          />
        </div>
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-6 pt-8 pb-4 text-center">
        <h3 className="text-balance font-semibold text-lg">No feedback yet</h3>
        <p className="mt-1.5 max-w-md text-pretty text-muted-foreground text-sm leading-relaxed">
          Add the feedback tool to your MCP server and agents using your product
          can report bugs, ideas and praise straight into this inbox.
        </p>
        <div className="mt-6 w-full text-left">
          <AgentFeedbackSetup
            className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5"
            organizationId={organizationId}
            setup={setup}
          />
        </div>
      </div>
    </div>
  );
}
