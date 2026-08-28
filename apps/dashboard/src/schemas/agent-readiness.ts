import { array, enum as enumType, number, object, string } from "zod";

export const agentReadinessWorkflowPayloadSchema = object({
  organizationId: string().min(1),
  projectId: string().min(1),
  reportId: string().min(1),
  targetUrl: string().url(),
});

export const agentReadinessApiProblemSchema = object({
  code: string().nullish(),
});

const agentReadinessTierBreakdownSchema = object({
  earned: number(),
  available: number(),
  passing: number(),
  total: number(),
});

/** Shape of the public Is Agentic report API (is-agentic.com/openapi.json). */
export const agentReadinessApiReportSchema = object({
  target: string(),
  display_target: string().nullish(),
  report_url: string().nullish(),
  score: number().nullish(),
  score_label: string().nullish(),
  scanned_at: string().nullish(),
  eligible_checks: number().nullish(),
  score_breakdown: object({
    essential: agentReadinessTierBreakdownSchema,
    recommended: agentReadinessTierBreakdownSchema,
    bonus: object({ points: number(), positive_signals: number() }),
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
