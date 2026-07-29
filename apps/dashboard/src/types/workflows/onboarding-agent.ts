export type OnboardingAgentWorkflowResult =
  | { status: "completed"; polls: number }
  | { status: "timed_out" }
  | { status: "invalid_payload" };
