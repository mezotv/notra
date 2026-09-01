import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { agentFeedbackDb } from "@/lib/agent-feedback/effect";
import { AgentFeedbackOrganizationNotFoundError } from "@/lib/agent-feedback/errors";
import type { AgentFeedbackSetupSource } from "@/types/agent-feedback";

export const readAgentFeedbackOrganization = Effect.fn(
  "agentFeedback.readOrganization"
)(function* (organizationId: string) {
  const row = yield* agentFeedbackDb("readOrganization", () =>
    db.query.organizations.findFirst({
      columns: { name: true, slug: true },
      where: eq(organizations.id, organizationId),
    })
  );
  if (!row) {
    return yield* Effect.fail(
      new AgentFeedbackOrganizationNotFoundError({ organizationId })
    );
  }
  const source: AgentFeedbackSetupSource = {
    organizationName: row.name,
    organizationSlug: row.slug,
  };
  return source;
});
