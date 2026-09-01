import { Data } from "effect";

export class AgentFeedbackDatabaseError extends Data.TaggedError(
  "AgentFeedbackDatabaseError"
)<{
  readonly label: string;
  readonly cause: unknown;
}> {}

export class AgentFeedbackNotFoundError extends Data.TaggedError(
  "AgentFeedbackNotFoundError"
)<{
  readonly feedbackId: string;
}> {}

export class AgentFeedbackOrganizationNotFoundError extends Data.TaggedError(
  "AgentFeedbackOrganizationNotFoundError"
)<{
  readonly organizationId: string;
}> {}

export type AgentFeedbackRouterError =
  | AgentFeedbackDatabaseError
  | AgentFeedbackNotFoundError
  | AgentFeedbackOrganizationNotFoundError;
