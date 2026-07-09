import { Schema } from "effect";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export const retryErrorSchema = z.looseObject({
  code: z.string().optional(),
  status: z.number().optional(),
});

export class ToolOperationError extends Schema.TaggedErrorClass<ToolOperationError>()(
  "ToolOperationError",
  {
    cause: Schema.Defect(),
    operationName: Schema.String,
    retryable: Schema.Boolean,
    retryAfterMs: Schema.optional(Schema.Number),
    status: Schema.optional(Schema.Number),
  }
) {}
