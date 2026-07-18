import { db } from "@notra/db/drizzle";
import { granolaIntegrations } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { GRANOLA_API_BASE_URL } from "../constants/granola";
import { decryptToken, encryptToken } from "../crypto/token-encryption";
import type {
  CreateGranolaIntegrationParams,
  GranolaKeyVerificationResult,
  UpdateGranolaIntegrationParams,
} from "../types/integrations";
import type { GranolaToolContext } from "../types/tools";
import { hasOrganizationAccess } from "../utils/organization-access";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export async function verifyGranolaApiKey(
  apiKey: string
): Promise<GranolaKeyVerificationResult> {
  try {
    const response = await fetch(`${GRANOLA_API_BASE_URL}/notes?page_size=1`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        valid: false,
        error: "Granola rejected this API key. Check the key and its scopes.",
      };
    }

    return {
      valid: false,
      error: `Granola API returned an unexpected status (${response.status}). Try again later.`,
    };
  } catch {
    return {
      valid: false,
      error: "Could not reach the Granola API to verify the key.",
    };
  }
}

export async function createGranolaIntegration(
  params: CreateGranolaIntegrationParams
) {
  const { organizationId, userId, displayName, apiKey, workspaceName } = params;

  if (!(await hasOrganizationAccess(userId, organizationId))) {
    throw new Error("User does not have access to this organization.");
  }

  const encryptedApiKey = encryptToken(apiKey);

  const id = `gra_${nanoid()}`;

  const [integration] = await db
    .insert(granolaIntegrations)
    .values({
      id,
      organizationId,
      createdByUserId: userId,
      displayName,
      encryptedApiKey,
      workspaceName: workspaceName ?? null,
    })
    .returning();

  return integration;
}

export async function getGranolaIntegrationById(integrationId: string) {
  const integration = await db.query.granolaIntegrations.findFirst({
    where: eq(granolaIntegrations.id, integrationId),
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

export async function getGranolaIntegrationsByOrganization(
  organizationId: string
) {
  return db.query.granolaIntegrations.findMany({
    where: eq(granolaIntegrations.organizationId, organizationId),
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

export async function updateGranolaIntegration(
  integrationId: string,
  updates: UpdateGranolaIntegrationParams
) {
  const [updated] = await db
    .update(granolaIntegrations)
    .set(updates)
    .where(eq(granolaIntegrations.id, integrationId))
    .returning();

  return updated;
}

export async function deleteGranolaIntegration(integrationId: string) {
  await db
    .delete(granolaIntegrations)
    .where(eq(granolaIntegrations.id, integrationId));
}

export async function getDecryptedGranolaApiKey(
  integrationId: string
): Promise<string | undefined> {
  const [integration] = await db
    .select({
      encryptedApiKey: granolaIntegrations.encryptedApiKey,
    })
    .from(granolaIntegrations)
    .where(eq(granolaIntegrations.id, integrationId))
    .limit(1);

  if (!integration?.encryptedApiKey) {
    return undefined;
  }

  return decryptToken(integration.encryptedApiKey);
}

export async function getGranolaToolContextByIntegrationId(
  integrationId: string,
  options: { organizationId: string }
): Promise<GranolaToolContext> {
  const whereClause = and(
    eq(granolaIntegrations.id, integrationId),
    eq(granolaIntegrations.organizationId, options.organizationId)
  );

  const [integration] = await db
    .select({
      id: granolaIntegrations.id,
      organizationId: granolaIntegrations.organizationId,
      encryptedApiKey: granolaIntegrations.encryptedApiKey,
      workspaceName: granolaIntegrations.workspaceName,
      enabled: granolaIntegrations.enabled,
    })
    .from(granolaIntegrations)
    .where(whereClause)
    .limit(1);

  if (!integration) {
    throw new Error(
      `Granola integration access denied. Unknown integrationId ${integrationId}.`
    );
  }

  if (!integration.enabled) {
    throw new Error(
      `Granola integration access denied for integrationId ${integrationId}. Integration is disabled.`
    );
  }

  return {
    integrationId: integration.id,
    organizationId: integration.organizationId,
    apiKey: decryptToken(integration.encryptedApiKey),
    workspaceName: integration.workspaceName,
  };
}
