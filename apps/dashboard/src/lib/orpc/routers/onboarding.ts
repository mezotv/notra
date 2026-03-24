import { db } from "@notra/db/drizzle";
import {
  brandSettings,
  contentTriggers,
  githubIntegrations,
  organizations,
} from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { authorizedProcedure } from "@/lib/orpc/base";
import { organizationIdSchema } from "@/schemas/auth/organization";

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
};
