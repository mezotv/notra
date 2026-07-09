import { defineHook, type HookDefinition } from "eve/hooks";
import {
  forgetSessionOrganization,
  markOnboardingAgentRan,
  rememberSessionOrganization,
} from "../utils/run-status";

export function createRunStatusHook(): HookDefinition {
  return defineHook({
    events: {
      "message.received"(event, ctx) {
        rememberSessionOrganization(ctx.session.id, event.data.message);
      },
      async "turn.completed"(_event, ctx) {
        await markOnboardingAgentRan(ctx.session.id);
      },
      async "session.completed"(_event, ctx) {
        await markOnboardingAgentRan(ctx.session.id);
      },
      "turn.failed"(event, ctx) {
        console.error(
          `[run-status] Onboarding agent turn failed for session ${ctx.session.id}: ${event.data.message}`
        );
      },
      "session.failed"(event, ctx) {
        forgetSessionOrganization(ctx.session.id);
        console.error(
          `[run-status] Onboarding agent session failed for session ${ctx.session.id}: ${event.data.message}`
        );
      },
    },
  });
}
