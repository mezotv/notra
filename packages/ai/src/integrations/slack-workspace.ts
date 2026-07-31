import { db } from "@notra/db/drizzle";
import { slackIntegrations } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { decryptToken, encryptToken } from "../crypto/token-encryption";
import type {
  CreateSlackIntegrationParams,
  UpdateSlackIntegrationParams,
} from "../types/integrations";
import { hasOrganizationAccess } from "../utils/organization-access";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export async function createSlackIntegration(
  params: CreateSlackIntegrationParams
) {
  const {
    organizationId,
    userId,
    displayName,
    botToken,
    slackTeamId,
    slackTeamName,
    slackBotUserId,
  } = params;

  if (!(await hasOrganizationAccess(userId, organizationId))) {
    throw new Error("User does not have access to this organization.");
  }

  const encryptedBotToken = encryptToken(botToken);
  const id = `slk_${nanoid()}`;

  const [integration] = await db
    .insert(slackIntegrations)
    .values({
      id,
      organizationId,
      createdByUserId: userId,
      displayName,
      encryptedBotToken,
      slackTeamId,
      slackTeamName: slackTeamName ?? null,
      slackBotUserId: slackBotUserId ?? null,
    })
    .returning();

  return integration;
}

export async function getSlackIntegrationById(
  organizationId: string,
  integrationId: string
) {
  const integration = await db.query.slackIntegrations.findFirst({
    where: and(
      eq(slackIntegrations.id, integrationId),
      eq(slackIntegrations.organizationId, organizationId)
    ),
    with: {
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return integration ?? null;
}

export async function getSlackIntegrationsByOrganization(
  organizationId: string
) {
  return db.query.slackIntegrations.findMany({
    where: eq(slackIntegrations.organizationId, organizationId),
    with: {
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
}

export async function getSlackIntegrationByTeamId(slackTeamId: string) {
  const integration = await db.query.slackIntegrations.findFirst({
    where: eq(slackIntegrations.slackTeamId, slackTeamId),
  });

  return integration ?? null;
}

export async function getEnabledSlackIntegrations() {
  return db.query.slackIntegrations.findMany({
    where: eq(slackIntegrations.enabled, true),
  });
}

export function getSlackIntegrationBotToken(integration: {
  encryptedBotToken: string;
}) {
  return decryptToken(integration.encryptedBotToken);
}

export async function updateSlackIntegration(
  params: UpdateSlackIntegrationParams
) {
  const { organizationId, integrationId, ...updates } = params;

  const [integration] = await db
    .update(slackIntegrations)
    .set(updates)
    .where(
      and(
        eq(slackIntegrations.id, integrationId),
        eq(slackIntegrations.organizationId, organizationId)
      )
    )
    .returning();

  return integration ?? null;
}

export async function disableSlackIntegrationByTeamId(slackTeamId: string) {
  const [updated] = await db
    .update(slackIntegrations)
    .set({ enabled: false })
    .where(eq(slackIntegrations.slackTeamId, slackTeamId))
    .returning({ id: slackIntegrations.id });

  return Boolean(updated);
}

export async function postSlackNotification(
  organizationId: string,
  text: string
): Promise<boolean> {
  const integrations = await db.query.slackIntegrations.findMany({
    where: and(
      eq(slackIntegrations.organizationId, organizationId),
      eq(slackIntegrations.enabled, true)
    ),
  });

  let delivered = false;
  for (const integration of integrations) {
    if (!integration.notificationChannelId) {
      continue;
    }
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        authorization: `Bearer ${decryptToken(integration.encryptedBotToken)}`,
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        channel: integration.notificationChannelId,
        text,
      }),
    });
    if (!response.ok) {
      continue;
    }
    const result = await response.json();
    if (
      typeof result === "object" &&
      result !== null &&
      "ok" in result &&
      result.ok === true
    ) {
      delivered = true;
    }
  }
  return delivered;
}

export async function deleteSlackIntegration(
  organizationId: string,
  integrationId: string
) {
  const [deleted] = await db
    .delete(slackIntegrations)
    .where(
      and(
        eq(slackIntegrations.id, integrationId),
        eq(slackIntegrations.organizationId, organizationId)
      )
    )
    .returning({ id: slackIntegrations.id });

  return Boolean(deleted);
}
