import type { LinearToolContext } from "@notra/ai/types/tools";
import { db } from "@notra/db/drizzle";
import { linearIntegrations, members } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { decryptToken, encryptToken } from "@/lib/crypto/token-encryption";
import type { CreateLinearIntegrationParams } from "@/types/integrations";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export async function createLinearIntegration(
  params: CreateLinearIntegrationParams
) {
  const {
    organizationId,
    userId,
    displayName,
    accessToken,
    linearOrganizationId,
    linearOrganizationName,
    linearTeamId,
    linearTeamName,
  } = params;

  const member = await db.query.members.findFirst({
    where: and(
      eq(members.organizationId, organizationId),
      eq(members.userId, userId)
    ),
  });

  if (!member) {
    throw new Error("User does not have access to this organization.");
  }

  const encryptedAccessToken = encryptToken(accessToken);

  const id = `lin_${nanoid()}`;

  const [integration] = await db
    .insert(linearIntegrations)
    .values({
      id,
      organizationId,
      createdByUserId: userId,
      displayName,
      encryptedAccessToken,
      linearOrganizationId,
      linearOrganizationName: linearOrganizationName ?? null,
      linearTeamId: linearTeamId ?? null,
      linearTeamName: linearTeamName ?? null,
    })
    .returning();

  return integration;
}

export async function getLinearIntegrationById(integrationId: string) {
  const integration = await db.query.linearIntegrations.findFirst({
    where: eq(linearIntegrations.id, integrationId),
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

export async function getLinearIntegrationsByOrganization(
  organizationId: string
) {
  return db.query.linearIntegrations.findMany({
    where: eq(linearIntegrations.organizationId, organizationId),
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
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });
}

export async function updateLinearIntegration(
  integrationId: string,
  updates: {
    displayName?: string;
    enabled?: boolean;
    linearTeamId?: string | null;
    linearTeamName?: string | null;
  }
) {
  const [updated] = await db
    .update(linearIntegrations)
    .set(updates)
    .where(eq(linearIntegrations.id, integrationId))
    .returning();

  return updated;
}

export async function deleteLinearIntegration(integrationId: string) {
  await db
    .delete(linearIntegrations)
    .where(eq(linearIntegrations.id, integrationId));
}

export async function getDecryptedLinearToken(
  integrationId: string
): Promise<string | undefined> {
  const [integration] = await db
    .select({
      encryptedAccessToken: linearIntegrations.encryptedAccessToken,
    })
    .from(linearIntegrations)
    .where(eq(linearIntegrations.id, integrationId))
    .limit(1);

  if (!integration?.encryptedAccessToken) {
    return undefined;
  }

  return decryptToken(integration.encryptedAccessToken);
}

export async function getDecryptedLinearWebhookSecret(
  integrationId: string
): Promise<string | undefined> {
  const [integration] = await db
    .select({
      encryptedWebhookSecret: linearIntegrations.encryptedWebhookSecret,
    })
    .from(linearIntegrations)
    .where(eq(linearIntegrations.id, integrationId))
    .limit(1);

  if (!integration?.encryptedWebhookSecret) {
    return undefined;
  }

  return decryptToken(integration.encryptedWebhookSecret);
}

export async function getLinearToolContextByIntegrationId(
  integrationId: string,
  options?: { organizationId?: string }
): Promise<LinearToolContext> {
  const whereClause = options?.organizationId
    ? and(
        eq(linearIntegrations.id, integrationId),
        eq(linearIntegrations.organizationId, options.organizationId)
      )
    : eq(linearIntegrations.id, integrationId);

  const [integration] = await db
    .select({
      id: linearIntegrations.id,
      organizationId: linearIntegrations.organizationId,
      encryptedAccessToken: linearIntegrations.encryptedAccessToken,
      linearTeamId: linearIntegrations.linearTeamId,
      enabled: linearIntegrations.enabled,
    })
    .from(linearIntegrations)
    .where(whereClause)
    .limit(1);

  if (!integration) {
    throw new Error(
      `Linear integration access denied. Unknown integrationId ${integrationId}.`
    );
  }

  if (!integration.enabled) {
    throw new Error(
      `Linear integration access denied for integrationId ${integrationId}. Integration is disabled.`
    );
  }

  if (!integration.encryptedAccessToken) {
    throw new Error(
      `Linear integration has no access token for integrationId ${integrationId}.`
    );
  }

  return {
    integrationId: integration.id,
    organizationId: integration.organizationId,
    accessToken: decryptToken(integration.encryptedAccessToken),
    linearTeamId: integration.linearTeamId,
  };
}
