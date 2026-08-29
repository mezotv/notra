import { Effect } from "effect";

import type { AgentFeedbackRouterError } from "@/lib/agent-feedback/errors";
import { readAgentFeedbackOrganization } from "@/lib/agent-feedback/organization";
import {
  listAgentFeedback,
  updateAgentFeedbackStatus,
} from "@/lib/agent-feedback/programs";
import { buildAgentFeedbackSetup } from "@/lib/agent-feedback/snippet";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { authorizedProcedure } from "@/lib/orpc/base";
import { runOrpcEffect } from "@/lib/orpc/effect";
import { toAgentFeedbackOrpcError } from "@/lib/orpc/utils/agent-feedback-errors";
import {
  agentFeedbackListInputSchema,
  agentFeedbackOrganizationInputSchema,
  agentFeedbackUpdateStatusInputSchema,
} from "@/schemas/agent-feedback";
import type { AgentFeedbackHandlerOptions } from "@/types/agent-feedback";

function agentFeedbackHandler<
  TInput extends { organizationId: string },
  TOutput,
  TError extends AgentFeedbackRouterError,
>(run: (input: TInput) => Effect.Effect<TOutput, TError>) {
  return async ({
    context,
    input,
  }: AgentFeedbackHandlerOptions<TInput>): Promise<TOutput> => {
    await assertOrganizationAccess({
      headers: context.headers,
      organizationId: input.organizationId,
      user: context.user,
    });

    return await runOrpcEffect(run(input), toAgentFeedbackOrpcError);
  };
}

export const agentFeedbackRouter = {
  list: authorizedProcedure
    .input(agentFeedbackListInputSchema)
    .handler(agentFeedbackHandler((input) => listAgentFeedback(input))),
  updateStatus: authorizedProcedure
    .input(agentFeedbackUpdateStatusInputSchema)
    .handler(agentFeedbackHandler((input) => updateAgentFeedbackStatus(input))),
  setup: authorizedProcedure
    .input(agentFeedbackOrganizationInputSchema)
    .handler(
      agentFeedbackHandler((input) =>
        Effect.map(
          readAgentFeedbackOrganization(input.organizationId),
          buildAgentFeedbackSetup
        )
      )
    ),
};
