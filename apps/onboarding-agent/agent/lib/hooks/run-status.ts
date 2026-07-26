import { defineHook, type HookDefinition } from "eve/hooks";
import { markOnboardingAgentRan } from "../utils/run-status";

export function createRunStatusHook(): HookDefinition {
  return defineHook({
    events: {
      async "turn.completed"(_event, ctx) {
        await markOnboardingAgentRan(ctx);
      },
      async "session.completed"(_event, ctx) {
        await markOnboardingAgentRan(ctx);
      },
      "turn.failed"(event, ctx) {
        console.error(
          `[run-status] Onboarding agent turn failed for session ${ctx.session.id}: ${event.data.message}`
        );
      },
      "session.failed"(event, ctx) {
        console.error(
          `[run-status] Onboarding agent session failed for session ${ctx.session.id}: ${event.data.message}`
        );
      },
    },
  });
}
