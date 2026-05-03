import { db } from "@notra/db/drizzle";
import {
  members,
  organizationNotificationSettings,
  organizations,
  users,
} from "@notra/db/schema";
import { ContentChatAnnouncement } from "@notra/email/emails/marketing-chat";
import { EMAIL_CONFIG } from "@notra/email/utils/config";
import { and, asc, eq, isNull, or } from "drizzle-orm";

const PROD_APP_URL = "https://app.usenotra.com";
const PROD_SITE_URL = "https://www.usenotra.com";
const PROD_LOGO_URL = `${PROD_SITE_URL}/icon1.png`;
const HERO_IMAGE_BASE_URL =
  process.env.MARKETING_HERO_BASE_URL ?? "https://www.usenotra.com";

import type { Resend } from "resend";
import type {
  MarketingChatRecipient,
  MarketingChatSendResult,
} from "@/types/email/marketing-chat";

export const MARKETING_CHAT_SUBJECT =
  "Introducing Content Chat: AI-powered content creation";

const MARKETING_CHAT_VERSION = "v7";

export async function listMarketingChatRecipients(): Promise<
  MarketingChatRecipient[]
> {
  const rows = await db
    .select({
      email: users.email,
      userName: users.name,
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
    })
    .from(organizations)
    .innerJoin(members, eq(members.organizationId, organizations.id))
    .innerJoin(users, eq(users.id, members.userId))
    .leftJoin(
      organizationNotificationSettings,
      eq(organizationNotificationSettings.organizationId, organizations.id)
    )
    .where(
      and(
        eq(members.role, "owner"),
        or(
          isNull(organizationNotificationSettings.marketingEmails),
          eq(organizationNotificationSettings.marketingEmails, true)
        )
      )
    )
    .orderBy(asc(organizations.createdAt));

  const seen = new Set<string>();
  const recipients: MarketingChatRecipient[] = [];
  for (const row of rows) {
    const dedupeKey = row.email.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    recipients.push(row);
  }

  return recipients;
}

export function buildMarketingChatUnsubscribeUrl(
  organizationSlug: string,
  appUrl = PROD_APP_URL
) {
  return `${appUrl}/${organizationSlug}/settings/notifications`;
}

const BATCH_SIZE = 100;
const INTER_BATCH_DELAY_MS = 220;

function buildEmailPayload(recipient: MarketingChatRecipient) {
  const unsubscribeUrl = buildMarketingChatUnsubscribeUrl(
    recipient.organizationSlug
  );
  const rawFirstName =
    recipient.userName.trim().split(/\s+/)[0] || recipient.userName;
  const firstName = rawFirstName.replace(/[.,!?;:]+$/g, "").replace(/\./g, "");
  const heroImageUrl = `${HERO_IMAGE_BASE_URL}/marketing/chat?name=${encodeURIComponent(firstName)}`;

  return {
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: recipient.email,
    subject: MARKETING_CHAT_SUBJECT,
    react: ContentChatAnnouncement({
      organizationSlug: recipient.organizationSlug,
      organizationName: recipient.organizationName,
      recipientName: recipient.userName,
      appUrl: PROD_APP_URL,
      siteUrl: PROD_SITE_URL,
      logoUrl: PROD_LOGO_URL,
      heroImageUrl,
      unsubscribeUrl,
    }),
    tags: [
      { name: "category", value: "marketing-chat" },
      { name: "org_slug", value: recipient.organizationSlug },
      { name: "version", value: MARKETING_CHAT_VERSION },
    ],
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export async function sendMarketingChatEmail(
  resend: Resend,
  recipient: MarketingChatRecipient
): Promise<MarketingChatSendResult> {
  const { data, error } = await resend.emails.send(
    buildEmailPayload(recipient),
    {
      idempotencyKey: `notra:marketing-chat:${MARKETING_CHAT_VERSION}:${recipient.email.toLowerCase()}`,
    }
  );

  if (error) {
    return {
      email: recipient.email,
      organizationSlug: recipient.organizationSlug,
      status: "failed",
      error: `${error.name}: ${error.message}`,
    };
  }

  return {
    email: recipient.email,
    organizationSlug: recipient.organizationSlug,
    status: "sent",
    id: data?.id,
  };
}

export async function sendMarketingChatBatch(
  resend: Resend,
  recipients: MarketingChatRecipient[]
): Promise<MarketingChatSendResult[]> {
  const results: MarketingChatSendResult[] = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, INTER_BATCH_DELAY_MS));
    }

    const chunk = recipients.slice(i, i + BATCH_SIZE);
    const payloads = chunk.map(buildEmailPayload);

    const { data, error } = await resend.batch.send(payloads, {
      batchValidation: "permissive",
    });

    if (error) {
      for (const recipient of chunk) {
        results.push({
          email: recipient.email,
          organizationSlug: recipient.organizationSlug,
          status: "failed",
          error: `${error.name}: ${error.message}`,
        });
      }
      continue;
    }

    const sentRows = data?.data ?? [];
    for (let idx = 0; idx < chunk.length; idx += 1) {
      const recipient = chunk[idx];
      if (!recipient) {
        continue;
      }
      const row = sentRows[idx];
      if (row?.id) {
        results.push({
          email: recipient.email,
          organizationSlug: recipient.organizationSlug,
          status: "sent",
          id: row.id,
        });
      } else {
        results.push({
          email: recipient.email,
          organizationSlug: recipient.organizationSlug,
          status: "failed",
          error: "no id returned from batch",
        });
      }
    }
  }

  return results;
}
