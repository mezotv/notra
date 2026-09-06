import { db } from "@notra/db/drizzle";
import { organizationNotificationSettings } from "@notra/db/schema";

export async function upsertOnboardingNotificationSettings({
  organizationId,
  dailySummary,
  marketingEmails,
}: {
  organizationId: string;
  dailySummary: boolean;
  marketingEmails: boolean;
}) {
  await db
    .insert(organizationNotificationSettings)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      scheduledContentCreation: false,
      scheduledContentFailed: false,
      scheduledContentSkipped: false,
      marketingEmails,
      dailySummary,
    })
    .onConflictDoUpdate({
      set: {
        dailySummary,
        marketingEmails,
        updatedAt: new Date(),
      },
      target: organizationNotificationSettings.organizationId,
    });
}
