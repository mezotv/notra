import { appendChatMessageIfMissing } from "@notra/ai/chat/history";
import { getSessionAttribute } from "@notra/tools/utils/session";
import { defineHook } from "eve/hooks";
import { resolveSlackMirrorChatId } from "../lib/utils/slack-chat-mirror";

export default defineHook({
  events: {
    async "message.completed"(event, ctx) {
      if (
        event.data.finishReason === "tool-calls" ||
        !event.data.message?.trim()
      ) {
        return;
      }

      try {
        const organizationId = getSessionAttribute(ctx, "organizationId");
        const chatId = await resolveSlackMirrorChatId(ctx);
        if (!(organizationId && chatId)) {
          return;
        }

        await appendChatMessageIfMissing(organizationId, chatId, {
          id: `eve:${ctx.session.id}:${event.data.turnId}:${event.data.stepIndex}`,
          role: "assistant",
          parts: [{ type: "text", text: event.data.message }],
        });
      } catch (error) {
        console.error("[agent] Slack chat mirror failed", error);
      }
    },
  },
});
