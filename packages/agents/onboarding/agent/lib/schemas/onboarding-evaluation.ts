import { z } from "zod";

const evaluationReferenceSnapshotSchema = z.object({
  applicableTo: z.array(z.string()),
  content: z.string(),
  createdAt: z.iso.datetime(),
  id: z.string(),
  metadata: z.unknown(),
  note: z.string().nullable(),
  type: z.string(),
});

const evaluationSkillSnapshotSchema = z.object({
  content: z.string(),
  id: z.string(),
  name: z.string(),
  updatedAt: z.iso.datetime(),
});

const evaluationCompanySnapshotSchema = z.object({
  domain: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  references: z.array(evaluationReferenceSnapshotSchema),
  skills: z.array(evaluationSkillSnapshotSchema),
});

export const onboardingEvaluationStateSchema = z.object({
  companies: z.array(evaluationCompanySnapshotSchema),
  evaluationId: z.string(),
  sessionIds: z.record(z.string(), z.string()),
  startedAt: z.iso.datetime(),
});
