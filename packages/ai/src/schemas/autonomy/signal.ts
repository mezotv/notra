// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const signalSourceSchema = z.enum([
  "github",
  "linear",
  "slack",
  "schedule",
  "manual",
  "internal",
]);
export type SignalSource = z.infer<typeof signalSourceSchema>;

export const signalEnvelopeSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  source: signalSourceSchema,
  sourceEventId: z.string().min(1).nullable(),
  kind: z.string().min(1).max(120),
  occurredAt: z.iso.datetime(),
  dedupeHash: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});
export type SignalEnvelope = z.infer<typeof signalEnvelopeSchema>;
