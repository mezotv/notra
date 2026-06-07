import { db } from "@notra/db/drizzle";
import { members, organizations } from "@notra/db/schema";
import { getResend } from "@notra/email/utils/resend";
import { and, eq } from "drizzle-orm";
import { sendAiCreditsDepletedEmail } from "@/lib/email/send";
import type { SendAiCreditsDepletedEmailsParams } from "@/types/workflows/ai-credit-notifications";

export async function sendAiCreditsDepletedEmails({
  organizationId,
  automationName,
  logPrefix,
}: SendAiCreditsDepletedEmailsParams) {
  const resend = getResend();
  if (!resend) {
    console.warn(
      `[${logPrefix}] Resend API key not configured, skipping AI credits depleted emails`
    );
    return;
  }

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

  await Promise.allSettled(
    ownerEmails.map((email) =>
      sendAiCreditsDepletedEmail(resend, {
        recipientEmail: email,
        organizationName,
        organizationSlug,
        automationName,
      }).then((result) => {
        if (result.error) {
          console.warn(
            `[${logPrefix}] Failed to send AI credits depleted notification to ${email}:`,
            result.error
          );
        }
      })
    )
  );
}
