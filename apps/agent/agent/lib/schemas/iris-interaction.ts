import { Data } from "effect";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const irisInteractionValueSchema = z.object({
  postId: z.string().min(1),
  organizationId: z.string().min(1),
  outboxId: z.string().min(1),
});
export type IrisInteractionValue = z.infer<typeof irisInteractionValueSchema>;

export class IrisInteractionError extends Data.TaggedError(
  "IrisInteractionError"
)<{
  readonly operation: string;
  readonly cause: unknown;
}> {}
