import { PLANNER_CONTRACT_VERSION } from "@notra/ai/schemas/autonomy/planner";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const plannerDraftTaskParamsSchema = z.looseObject({
  topic: z.string().optional(),
  angle: z.string().optional(),
  audience: z.string().optional(),
  imageCount: z.number().int().optional(),
  platform: z.string().optional(),
  focus: z.string().optional(),
});
export type PlannerDraftTaskParams = z.infer<
  typeof plannerDraftTaskParamsSchema
>;

export const plannerDraftTaskSchema = z.object({
  localId: z.string(),
  capabilityName: z.string(),
  capabilityVersion: z.number(),
  params: plannerDraftTaskParamsSchema,
  dependsOn: z.array(z.string()).default([]),
  reason: z.string(),
});
export type PlannerDraftTask = z.infer<typeof plannerDraftTaskSchema>;

export const plannerDraftOutputSchema = z.object({
  contractVersion: z.literal(PLANNER_CONTRACT_VERSION),
  mandate: z.object({
    mandateId: z.string(),
    mandateVersion: z.number(),
  }),
  decision: z.enum(["no_op", "plan", "escalate"]),
  reason: z.string(),
  consumedSignalIds: z.array(z.string()).default([]),
  goal: z
    .object({
      title: z.string(),
      summary: z.string().optional(),
    })
    .optional(),
  tasks: z.array(plannerDraftTaskSchema).default([]),
});
export type PlannerDraftOutput = z.infer<typeof plannerDraftOutputSchema>;
