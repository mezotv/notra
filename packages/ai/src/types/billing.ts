export interface ModelPricing {
  inputPerMillionTokens: number;
  outputPerMillionTokens: number;
  cacheReadPerMillionTokens: number;
  cacheWritePerMillionTokens: number;
}

export type AiCreditBillingBasis = "reported_total_usd" | "tokens";

export type TeamMembersLimitStatus =
  | "allowed"
  | "limit-reached"
  | "check-unavailable";

export interface AiCreditCostResult {
  costCents: number;
  billingBasis: AiCreditBillingBasis;
  reportedCostCents?: number;
  tokenCostCents: number;
}
