import { defineHook, type HookDefinition } from "eve/hooks";
import { appendStreamEvent } from "../utils/stream-log";

export function createStreamLogHook(): HookDefinition {
  return defineHook({
    events: {
      async "*"(event, ctx) {
        await appendStreamEvent(ctx.session.id, event);
      },
    },
  });
}
