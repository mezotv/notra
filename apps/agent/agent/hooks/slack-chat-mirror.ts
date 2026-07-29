import { appendChatMessageIfMissing } from "@notra/ai/chat/history";
import { getSessionAttribute } from "@notra/tools/utils/session";
import { Effect } from "effect";
import { defineHook } from "eve/hooks";
import { SlackChatMirrorError } from "../lib/schemas/slack";
import { resolveSlackMirrorChatId } from "../lib/utils/slack-chat-mirror";

export default defineHook({
  events: {
    async "message.completed"(event, ctx) {
      const messageText = event.data.message;
      if (event.data.finishReason === "tool-calls" || !messageText?.trim()) {
        return;
      }

      await Effect.runPromise(
        Effect.gen(function* () {
          const organizationId = getSessionAttribute(ctx, "organizationId");
          const chatId = yield* Effect.tryPromise({
            try: () => resolveSlackMirrorChatId(ctx),
            catch: (cause) =>
              new SlackChatMirrorError({
                cause,
                operation: "resolve-mirror-chat-id",
              }),
          });
          if (!(organizationId && chatId)) {
            return;
          }

          yield* Effect.tryPromise({
            try: () =>
              appendChatMessageIfMissing(organizationId, chatId, {
                id: `eve:${ctx.session.id}:${event.data.turnId}:${event.data.stepIndex}`,
                role: "assistant",
                parts: [{ type: "text", text: messageText }],
              }),
            catch: (cause) =>
              new SlackChatMirrorError({
                cause,
                operation: "append-assistant-message",
              }),
          });
        }).pipe(
          Effect.catch((error) =>
            Effect.logWarning("[agent] Slack chat mirror failed", error)
          )
        )
      );
    },
  },
});
