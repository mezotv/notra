import { db } from "@notra/db/drizzle";
import { organizationNotificationSettings } from "@notra/db/schema";
import { eq } from "drizzle-orm";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { assertActiveSubscription } from "@/lib/billing/subscription";
import { authorizedProcedure } from "@/lib/orpc/base";
import { organizationIdSchema } from "@/schemas/auth/organization";
import { updateNotificationSettingsSchema } from "@/schemas/notification-settings";
import { forbidden } from "../utils/errors";

const notificationSettingsInputSchema = z.object({
  organizationId: organizationIdSchema,
});

const updateNotificationSettingsInputSchema =
  notificationSettingsInputSchema.extend(
    updateNotificationSettingsSchema.shape
  );

export const notificationsRouter = {
  get: authorizedProcedure
    .input(notificationSettingsInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const settings =
        await db.query.organizationNotificationSettings.findFirst({
          where: eq(
            organizationNotificationSettings.organizationId,
            input.organizationId
          ),
        });

      return {
        settings: settings ?? {
          scheduledContentCreation: false,
          scheduledContentFailed: false,
          marketingEmails: true,
        },
      };
    }),
  update: authorizedProcedure
    .input(updateNotificationSettingsInputSchema)
    .handler(async ({ context, input }) => {
      const access = await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });
      await assertActiveSubscription(input.organizationId);

      if (access.membership.role !== "owner") {
        throw forbidden(
          "Only the organization owner can update notification settings"
        );
      }

      const updates: Record<string, boolean | Date> = {
        updatedAt: new Date(),
      };

      if (input.scheduledContentCreation !== undefined) {
        updates.scheduledContentCreation = input.scheduledContentCreation;
      }

      if (input.scheduledContentFailed !== undefined) {
        updates.scheduledContentFailed = input.scheduledContentFailed;
      }

      if (input.marketingEmails !== undefined) {
        updates.marketingEmails = input.marketingEmails;
      }

      const [updated] = await db
        .insert(organizationNotificationSettings)
        .values({
          id: crypto.randomUUID(),
          organizationId: input.organizationId,
          scheduledContentCreation: input.scheduledContentCreation ?? false,
          scheduledContentFailed: input.scheduledContentFailed ?? false,
          marketingEmails: input.marketingEmails ?? true,
        })
        .onConflictDoUpdate({
          set: updates,
          target: organizationNotificationSettings.organizationId,
        })
        .returning();

      return { settings: updated };
    }),
};
