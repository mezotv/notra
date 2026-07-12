import type { z } from "zod";
import type { onboardingEvaluationStateSchema } from "../schemas/onboarding-evaluation";

export interface EvaluationReferenceSnapshot {
  applicableTo: string[];
  content: string;
  createdAt: string;
  id: string;
  metadata: unknown;
  note: string | null;
  type: string;
}

export interface EvaluationSkillSnapshot {
  content: string;
  id: string;
  name: string;
  updatedAt: string;
}

export interface EvaluationCompanySnapshot {
  domain: string;
  organizationId: string;
  organizationName: string;
  references: EvaluationReferenceSnapshot[];
  skills: EvaluationSkillSnapshot[];
}

export interface TextDiffLine {
  kind: "added" | "removed" | "unchanged";
  newLine: number | null;
  oldLine: number | null;
  value: string;
}

export type OnboardingEvaluationState = z.infer<
  typeof onboardingEvaluationStateSchema
>;
