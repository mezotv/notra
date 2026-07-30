import { z } from "zod";

export const slackPostMessageResponseSchema = z.looseObject({
  ok: z.boolean(),
  ts: z.string().optional(),
  error: z.string().optional(),
});

export const slackExternalChannelKeySchema = z
  .string()
  .regex(/^[^:]+:[^:]+:[^:]+$/u);
