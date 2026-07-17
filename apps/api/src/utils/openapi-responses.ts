import { z } from "@hono/zod-openapi";
import { errorResponseSchema } from "../schemas/content";

export function errorResponse(description: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
  };
}

const rateLimitResponseSchema = z
  .object({
    error: z.string(),
    limit: z.number().int().min(1),
    remaining: z.number().int().min(0),
    reset: z.number().int(),
  })
  .openapi("RateLimitErrorResponse");

const rateLimitHeaderDescriptors = {
  "RateLimit-Limit": {
    description: "Maximum requests allowed in the current window.",
    schema: { type: "integer" as const },
  },
  "RateLimit-Remaining": {
    description: "Requests remaining in the current window.",
    schema: { type: "integer" as const },
  },
  "RateLimit-Reset": {
    description: "Seconds until the current window resets.",
    schema: { type: "integer" as const },
  },
  "Retry-After": {
    description: "Seconds the client should wait before retrying.",
    schema: { type: "integer" as const },
  },
};

export function rateLimitResponse(limit: number, window: string) {
  return {
    description: `Rate limit exceeded. This endpoint allows ${limit} requests per ${window} per organization.`,
    headers: rateLimitHeaderDescriptors,
    content: {
      "application/json": {
        schema: rateLimitResponseSchema,
      },
    },
  };
}
