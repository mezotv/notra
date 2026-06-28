import { db } from "@notra/db/drizzle";
import { members, organizations } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { enqueueContentEmailDigest } from "@/lib/workflows/shared/content-email-digest-enqueue";
import type { SendAiCreditsDepletedEmailsParams } from "@/types/workflows/ai-credit-notifications";

export async function sendAiCreditsDepletedEmails({
  organizationId,
  automationName,
  logPrefix,
}: SendAiCreditsDepletedEmailsParams) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: { name: true, slug: true },
  });

  const ownerMemberships = await db.query.members.findMany({
    where: and(
      eq(members.organizationId, organizationId),
      eq(members.role, "owner")
    ),
    with: { users: { columns: { email: true } } },
  });

  const ownerEmails = ownerMemberships.map((m) => m.users.email);
  if (ownerEmails.length === 0) {
    return;
  }

  const organizationName = org?.name ?? "Your organization";
  const organizationSlug = org?.slug ?? "";

  await enqueueContentEmailDigest({
    organizationId,
    recipientEmails: ownerEmails,
    kind: "ai_credits_depleted",
    event: {
      organizationName,
      organizationSlug,
      automationName,
    },
    logPrefix,
  });
}
