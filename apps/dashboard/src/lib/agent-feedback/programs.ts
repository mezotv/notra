import { AGENT_FEEDBACK_STATUSES } from "@notra/db/constants/agent-feedback";
import { db } from "@notra/db/drizzle";
import { agentFeedback } from "@notra/db/schema";
import type { AgentFeedbackStatus } from "@notra/db/types/agent-feedback";
import { and, count, desc, eq, lt, or, sql } from "drizzle-orm";
import { Effect } from "effect";

import { agentFeedbackDb } from "@/lib/agent-feedback/effect";
import { AgentFeedbackNotFoundError } from "@/lib/agent-feedback/errors";
import {
  decodeAgentFeedbackCursor,
  encodeAgentFeedbackCursor,
  toAgentFeedbackItem,
} from "@/lib/agent-feedback/mappers";
import type {
  AgentFeedbackItem,
  AgentFeedbackListInput,
  AgentFeedbackListResponse,
  AgentFeedbackUpdateStatusInput,
} from "@/types/agent-feedback";

function emptyCounts(): Record<AgentFeedbackStatus, number> {
  const counts = {} as Record<AgentFeedbackStatus, number>;
  for (const status of AGENT_FEEDBACK_STATUSES) {
    counts[status] = 0;
  }
  return counts;
}

export const listAgentFeedback = Effect.fn("agentFeedback.list")(function* (
  input: AgentFeedbackListInput
) {
  const limit = input.limit ?? 50;
  const cursor = input.cursor ? decodeAgentFeedbackCursor(input.cursor) : null;
  const conditions = [eq(agentFeedback.organizationId, input.organizationId)];
  if (input.status) {
    conditions.push(eq(agentFeedback.status, input.status));
  }
  if (input.kind) {
    conditions.push(eq(agentFeedback.kind, input.kind));
  }
  if (cursor) {
    const cursorCondition = or(
      lt(agentFeedback.createdAt, cursor.createdAt),
      and(
        eq(agentFeedback.createdAt, cursor.createdAt),
        lt(agentFeedback.id, cursor.id)
      )
    );
    if (cursorCondition) {
      conditions.push(cursorCondition);
    }
  }

  const rows = yield* agentFeedbackDb("list", () =>
    db
      .select()
      .from(agentFeedback)
      .where(and(...conditions))
      .orderBy(desc(agentFeedback.createdAt), desc(agentFeedback.id))
      .limit(limit + 1)
  );

  const countRows = yield* agentFeedbackDb("counts", () =>
    db
      .select({ status: agentFeedback.status, total: count() })
      .from(agentFeedback)
      .where(eq(agentFeedback.organizationId, input.organizationId))
      .groupBy(agentFeedback.status)
  );

  const counts = emptyCounts();
  for (const row of countRows) {
    counts[row.status] = row.total;
  }

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const last = pageRows.at(-1);

  const response: AgentFeedbackListResponse = {
    items: pageRows.map(toAgentFeedbackItem),
    nextCursor: hasMore && last ? encodeAgentFeedbackCursor(last) : null,
    counts,
  };
  return response;
});

export const updateAgentFeedbackStatus = Effect.fn(
  "agentFeedback.updateStatus"
)(function* (input: AgentFeedbackUpdateStatusInput) {
  const [updated] = yield* agentFeedbackDb("updateStatus", () =>
    db
      .update(agentFeedback)
      .set({
        status: input.status,
        resolvedAt: input.status === "resolved" ? sql`now()` : sql`null`,
      })
      .where(
        and(
          eq(agentFeedback.organizationId, input.organizationId),
          eq(agentFeedback.id, input.feedbackId)
        )
      )
      .returning()
  );

  if (!updated) {
    return yield* Effect.fail(
      new AgentFeedbackNotFoundError({ feedbackId: input.feedbackId })
    );
  }

  const item: AgentFeedbackItem = toAgentFeedbackItem(updated);
  return item;
});
