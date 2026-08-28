import { array, enum as enumType, iso, number, object, string, url } from "zod";

import { AGENT_READINESS_MAX_SCORE } from "@/constants/agent-readiness";

export const agentReadinessWorkflowPayloadSchema = object({
  organizationId: string().min(1),
  projectId: string().min(1),
  reportId: string().min(1),
  targetUrl: url(),
});

export const agentReadinessApiProblemSchema = object({
  code: string().nullish(),
});

const agentReadinessTierBreakdownSchema = object({
  earned: number().nonnegative(),
  available: number().nonnegative(),
  passing: number().int().nonnegative(),
  total: number().int().nonnegative(),
});

/** Shape of the public Is Agentic report API (is-agentic.com/openapi.json). */
export const agentReadinessApiReportSchema = object({
  target: url(),
  display_target: string().nullish(),
  report_url: url().nullish(),
  score: number().min(0).max(AGENT_READINESS_MAX_SCORE).nullish(),
  score_label: string().nullish(),
  scanned_at: iso.datetime().nullish(),
  eligible_checks: number().int().nonnegative().nullish(),
  score_breakdown: object({
    essential: agentReadinessTierBreakdownSchema,
    recommended: agentReadinessTierBreakdownSchema,
    bonus: object({
      points: number().nonnegative(),
      positive_signals: number().int().nonnegative(),
    }),
  }).nullish(),
  issues: array(
    object({
      id: string(),
      name: string(),
      tier: enumType(["essential", "recommended", "bonus"]),
      result: enumType(["failed", "partial"]),
      details: string().nullish(),
      recommendation: string().nullish(),
    })
  ).nullish(),
});
