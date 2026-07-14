import { getBaseUrl } from "@notra/ai/qstash/triggers";
import type { OnboardingAgentWorkflowPayload } from "@notra/ai/types/onboarding-agent";
import type { WorkflowContext } from "@upstash/workflow";
import { serve } from "@upstash/workflow/nextjs";
import { createRequestLogger } from "evlog";
import { flattenError } from "zod";
import {
  AGENT_RUN_BACKEND_SLEEP_SECONDS,
  AGENT_RUN_HARD_LIMIT_POLLS,
  AGENT_RUN_SOFT_LIMIT_POLLS,
} from "@/constants/onboarding-agent";
import {
  getOnboardingAgentState,
  releaseOnboardingAgentReservation,
  sendOnboardingSlackInvite,
  startOnboardingAgentSession,
} from "@/lib/onboarding-agent";
import { onboardingAgentWorkflowPayloadSchema } from "@/schemas/onboarding-agent";

export const { POST } = serve<OnboardingAgentWorkflowPayload>(
  async (context: WorkflowContext<OnboardingAgentWorkflowPayload>) => {
    const log = createRequestLogger({
      method: "POST",
      path: "/api/workflows/onboarding-agent",
    });

    const parseResult = onboardingAgentWorkflowPayloadSchema.safeParse(
      context.requestPayload
    );
    if (!parseResult.success) {
      console.error(
        "[Onboarding Agent] Invalid payload:",
        flattenError(parseResult.error)
      );
      log.set({ feature: "onboarding_agent", invalidPayload: true });
      log.emit();
      await context.cancel();
      return;
    }
    const { organizationId, domain, email, organizationName, reservedAt } =
      parseResult.data;
    const reservationDate = new Date(reservedAt);

    log.set({ domain, feature: "onboarding_agent", organizationId });

    try {
      if (email && organizationName) {
        const invite = await context.run("slack-connect-invite", () =>
          sendOnboardingSlackInvite({ email, organizationName })
        );
        log.set({ slackInvited: invite.invited });
      }

      const { sessionId } = await context.run("start-session", () =>
        startOnboardingAgentSession({
          domain,
          organizationId,
          reservedAt,
        })
      );
      log.set({ sessionId });

      for (let poll = 1; poll <= AGENT_RUN_HARD_LIMIT_POLLS; poll++) {
        await context.sleep(`wait-${poll}`, AGENT_RUN_BACKEND_SLEEP_SECONDS);

        const state = await context.run(`check-${poll}`, () =>
          getOnboardingAgentState(organizationId)
        );

        if (state.ran) {
          log.set({ polls: poll, runStatus: "completed" });
          return;
        }

        if (poll === AGENT_RUN_SOFT_LIMIT_POLLS) {
          log.set({ exceededSoftLimit: true });
        }
      }

      log.set({ runStatus: "timed_out" });
      console.error(
        `[Onboarding Agent] Run for organization ${organizationId} did not finish within the hard time limit`
      );
      await context.run("release-timed-out-reservation", () =>
        releaseOnboardingAgentReservation(organizationId, reservationDate)
      );
    } finally {
      log.emit();
    }
  },
  {
    baseUrl: getBaseUrl(),
    failureFunction: async ({ context, failStatus, failResponse }) => {
      const { organizationId, reservedAt } = context.requestPayload;
      console.error(
        `[Onboarding Agent] Workflow failed for organization ${organizationId}:`,
        { response: failResponse, status: failStatus }
      );
      if (organizationId && reservedAt) {
        await releaseOnboardingAgentReservation(
          organizationId,
          new Date(reservedAt)
        );
      }
    },
  }
);
