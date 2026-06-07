export type WorkflowAiCreditGateResult =
  | {
      allowed: true;
      reserved: boolean;
      useMarkup: boolean;
    }
  | {
      allowed: false;
      reason: "no_active_paid_plan" | "insufficient_ai_credits";
      shouldNotify: boolean;
      balanceRemaining: number | null;
    };
