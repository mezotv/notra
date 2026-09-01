import { Effect } from "effect";

import { AgentFeedbackDatabaseError } from "@/lib/agent-feedback/errors";

export function agentFeedbackDb<A>(
  label: string,
  run: () => Promise<A>
): Effect.Effect<A, AgentFeedbackDatabaseError> {
  return Effect.tryPromise({
    try: run,
    catch: (cause) => new AgentFeedbackDatabaseError({ label, cause }),
  });
}
