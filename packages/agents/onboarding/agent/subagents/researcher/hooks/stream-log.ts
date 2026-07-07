import { defineHook, type HookDefinition } from "eve/hooks";
import { appendStreamEvent } from "../../../lib/utils/stream-log";

const streamLogHook: HookDefinition = defineHook({
  events: {
    async "*"(event, ctx) {
      await appendStreamEvent(ctx.session.id, event);
    },
  },
});

export default streamLogHook;
