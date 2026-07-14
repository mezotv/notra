import { db } from "@notra/db/drizzle";
import {
  brandSettings,
  contentTriggers,
  githubIntegrations,
  onboardingSuggestions,
  organizations,
} from "@notra/db/schema";
import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  AGENT_RUN_HARD_LIMIT_MS,
  SELF_SERVE_AGENT_ERROR_MESSAGES,
} from "@/constants/onboarding-agent";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import {
  getOnboardingAgentState,
  startSelfServeOnboardingAgent,
} from "@/lib/onboarding-agent";
import { authorizedProcedure } from "@/lib/orpc/base";
import { organizationIdSchema } from "@/schemas/auth/organization";
import {
  dismissSuggestionInputSchema,
  listSuggestionsInputSchema,
} from "@/schemas/onboarding-agent";
import { ratelimit } from "@/utils/ratelimit";

const onboardingInputSchema = z.object({
  organizationId: organizationIdSchema,
});

export const onboardingRouter = {
  get: authorizedProcedure
    .input(onboardingInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const [org, brand, integration, schedule] = await Promise.all([
        db.query.organizations.findFirst({
          columns: { onboardingCompleted: true, onboardingDismissed: true },
          where: eq(organizations.id, input.organizationId),
        }),
        db.query.brandSettings.findFirst({
          columns: { id: true },
          where: eq(brandSettings.organizationId, input.organizationId),
        }),
        db.query.githubIntegrations.findFirst({
          columns: { id: true },
          where: eq(githubIntegrations.organizationId, input.organizationId),
        }),
        db.query.contentTriggers.findFirst({
          columns: { id: true },
          where: and(
            eq(contentTriggers.organizationId, input.organizationId),
            eq(contentTriggers.sourceType, "cron")
          ),
        }),
      ]);

      const hasBrandIdentity = !!brand;
      const hasIntegration = !!integration;
      const hasSchedule = !!schedule;
      const onboardingCompleted = org?.onboardingCompleted ?? false;
      const onboardingDismissed = org?.onboardingDismissed ?? false;

      if (
        hasBrandIdentity &&
        hasIntegration &&
        hasSchedule &&
        !onboardingCompleted
      ) {
        await db
          .update(organizations)
          .set({ onboardingCompleted: true })
          .where(eq(organizations.id, input.organizationId));
      }

      return {
        hasBrandIdentity,
        hasIntegration,
        hasSchedule,
        onboardingCompleted:
          hasBrandIdentity && hasIntegration && hasSchedule
            ? true
            : onboardingCompleted,
        onboardingDismissed,
      };
    }),
  agentRun: authorizedProcedure
    .input(onboardingInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const { ran, startedAt } = await getOnboardingAgentState(
        input.organizationId
      );
      const running =
        !ran &&
        startedAt !== null &&
        Date.now() - startedAt.getTime() < AGENT_RUN_HARD_LIMIT_MS;

      return { ran, running, startedAt };
    }),
  runAgent: authorizedProcedure
    .input(onboardingInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const { success: withinLimit } = await ratelimit.onboardingAgent.limit(
        input.organizationId
      );
      if (!withinLimit) {
        throw new ORPCError("TOO_MANY_REQUESTS", {
          message:
            "Too many onboarding agent requests. Please try again shortly.",
        });
      }

      const result = await startSelfServeOnboardingAgent({
        email: context.user.email,
        organizationId: input.organizationId,
      });

      if (
        !result.started &&
        (result.reason === "no-company-domain" ||
          result.reason === "website-unreachable")
      ) {
        throw new ORPCError("BAD_REQUEST", {
          message: SELF_SERVE_AGENT_ERROR_MESSAGES[result.reason],
        });
      }

      return { started: result.started };
    }),
  suggestions: authorizedProcedure
    .input(listSuggestionsInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const filters = [
        eq(onboardingSuggestions.organizationId, input.organizationId),
      ];
      if (!input.includeDismissed) {
        filters.push(eq(onboardingSuggestions.dismissed, false));
      }

      return await db.query.onboardingSuggestions.findMany({
        orderBy: [desc(onboardingSuggestions.createdAt)],
        where: and(...filters),
      });
    }),
  dismissSuggestion: authorizedProcedure
    .input(dismissSuggestionInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const updated = await db
        .update(onboardingSuggestions)
        .set({ dismissed: true })
        .where(
          and(
            eq(onboardingSuggestions.id, input.suggestionId),
            eq(onboardingSuggestions.organizationId, input.organizationId)
          )
        )
        .returning({ id: onboardingSuggestions.id });

      if (!updated[0]) {
        throw new ORPCError("NOT_FOUND", {
          message: "Suggestion not found",
        });
      }

      return { id: updated[0].id };
    }),
};
