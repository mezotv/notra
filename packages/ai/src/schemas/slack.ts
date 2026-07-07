// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export const slackInviteSharedResponseSchema = z.looseObject({
  ok: z.boolean(),
  error: z.string().optional(),
  invite_id: z.string().optional(),
  is_legacy_shared_channel: z.boolean().optional(),
});

export const slackOkResponseSchema = z.looseObject({
  ok: z.boolean(),
  error: z.string().optional(),
});

export const slackCreateChannelResponseSchema = z.looseObject({
  ok: z.boolean(),
  error: z.string().optional(),
  channel: z
    .looseObject({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
});
