import { defineHook, type HookDefinition } from "eve/hooks";
import { appendStreamEvent } from "../utils/stream-log";
import {
  isTerminalStreamEvent,
  writeStreamReport,
} from "../utils/stream-report";

export function createStreamLogHook(): HookDefinition {
  return defineHook({
    events: {
      async "*"(event, ctx) {
        await appendStreamEvent(ctx.session.id, event);
        if (isTerminalStreamEvent(event)) {
          try {
            await writeStreamReport(ctx.session.id);
          } catch (error) {
            console.error("Failed to write stream report", error);
          }
        }
      },
    },
  });
}
