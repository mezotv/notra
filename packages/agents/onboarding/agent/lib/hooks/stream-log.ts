import { defineHook, type HookDefinition } from "eve/hooks";
import { shouldUseDurableStreamStorage } from "../constants/stream-log";
import { appendStreamEvent } from "../utils/stream-log";
import {
  isTerminalStreamEvent,
  renderStreamReport,
  writeStreamReport,
} from "../utils/stream-report";
import {
  readDurableStreamEvents,
  writeDurableStreamReport,
} from "../utils/stream-storage";

export function createStreamLogHook(): HookDefinition {
  return defineHook({
    events: {
      async "*"(event, ctx) {
        await appendStreamEvent(ctx.session.id, event);
        if (isTerminalStreamEvent(event)) {
          if (shouldUseDurableStreamStorage()) {
            const events = await readDurableStreamEvents(ctx.session.id);
            await writeDurableStreamReport(
              ctx.session.id,
              renderStreamReport(ctx.session.id, events),
              events
            );
          } else {
            await writeStreamReport(ctx.session.id);
          }
        }
      },
    },
  });
}
