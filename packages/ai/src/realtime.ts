import { Realtime } from "@upstash/realtime";
import z from "zod/v4";
import { redis } from "./utils/redis";

const schema = {
  ai: { chunk: z.any() as z.ZodType<unknown> },
};

export const realtime = redis
  ? new Realtime({
      schema,
      redis,
      history: {
        maxLength: 1000,
        expireAfterSecs: 60 * 60,
      },
    })
  : null;

export type RealtimeSchema = typeof schema;
