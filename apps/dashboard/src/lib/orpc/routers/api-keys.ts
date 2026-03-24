import { z } from "zod";
import {
  getPermissionLevel,
  getPermissionsForLevel,
} from "@/lib/api-keys/permissions";
import { unkey } from "@/lib/api-keys/unkey";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { authorizedProcedure } from "@/lib/orpc/base";
import {
  createApiKeySchema,
  deleteApiKeySchema,
  EXPIRATION_MS,
  updateApiKeySchema,
} from "@/schemas/api-keys";
import { organizationIdSchema } from "@/schemas/auth/organization";
import {
  badRequest,
  internalServerError,
  notFound,
  serviceUnavailable,
} from "../utils/errors";

const organizationInputSchema = z.object({
  organizationId: organizationIdSchema,
});

const updateKeyInputSchema = z.object({
  keyIdParam: z.string().min(1),
  organizationId: organizationIdSchema,
  payload: updateApiKeySchema,
});

const deleteKeyInputSchema = z.object({
  keyIdParam: z.string().min(1),
  organizationId: organizationIdSchema,
  payload: deleteApiKeySchema,
});

function inferExpirationOption(createdAt: number, expires: number | null) {
  if (expires === null) {
    return "never" as const;
  }

  const ttl = Math.max(0, expires - createdAt);
  const day = 24 * 60 * 60 * 1000;

  if (ttl <= 7 * day) {
    return "7d" as const;
  }

  if (ttl <= 30 * day) {
    return "30d" as const;
  }

  if (ttl <= 60 * day) {
    return "60d" as const;
  }

  return "90d" as const;
}

function requireUnkeyConfig() {
  if (!unkey) {
    throw serviceUnavailable("API key service is not configured");
  }

  const apiId = process.env.UNKEY_API_ID;
  if (!apiId) {
    throw serviceUnavailable("API key service is not configured");
  }

  return {
    apiId,
    client: unkey,
  };
}

async function findOrganizationKey(
  client: NonNullable<typeof unkey>,
  apiId: string,
  organizationId: string,
  keyId: string
) {
  const keysResult = await client.apis.listKeys({
    apiId,
    externalId: organizationId,
  });

  const keys = keysResult?.data ?? [];
  return keys.find((key) => key.keyId === keyId) ?? null;
}

export const apiKeysRouter = {
  list: authorizedProcedure
    .input(organizationInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const { apiId, client } = requireUnkeyConfig();
      const result = await client.apis.listKeys({
        apiId,
        externalId: input.organizationId,
      });

      const keysData = result.data ?? [];

      return keysData.map((key) => {
        const meta = key.meta ?? {};
        const permissions = Array.isArray(key.permissions)
          ? key.permissions.filter(
              (permission): permission is string =>
                typeof permission === "string"
            )
          : [];

        const normalizedPermission = getPermissionLevel(
          permissions,
          meta.permission
        );

        return {
          createdAt: key.createdAt,
          createdBy: meta.createdBy ?? null,
          enabled: key.enabled,
          expires: key.expires ?? null,
          keyId: key.keyId,
          name: key.name ?? "Unnamed",
          permission: normalizedPermission,
          permissions,
          start: key.start,
        };
      });
    }),
  create: authorizedProcedure
    .input(organizationInputSchema.extend(createApiKeySchema.shape))
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const { apiId, client } = requireUnkeyConfig();
      const expiresMs = EXPIRATION_MS[input.expiration];
      const expires = expiresMs ? Date.now() + expiresMs : undefined;

      const created = await client.keys.createKey({
        apiId,
        expires,
        externalId: input.organizationId,
        meta: {
          createdBy: context.user.name,
          permission: input.permission,
        },
        name: input.name,
        permissions: getPermissionsForLevel(input.permission),
        prefix: "ntra",
      });

      const fullKey = created.data?.key;
      const keyId = created.data?.keyId;

      if (!(fullKey && keyId)) {
        throw internalServerError("Failed to create API key");
      }

      return {
        key: fullKey,
        keyId,
        name: input.name,
      };
    }),
  update: authorizedProcedure
    .input(updateKeyInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const { apiId, client } = requireUnkeyConfig();

      if (input.payload.keyId !== input.keyIdParam) {
        throw badRequest("Key ID mismatch");
      }

      const key = await findOrganizationKey(
        client,
        apiId,
        input.organizationId,
        input.payload.keyId
      );

      if (!key) {
        throw notFound("API key not found");
      }

      const meta =
        key.meta && typeof key.meta === "object"
          ? (key.meta as Record<string, unknown>)
          : {};

      const currentExpiration = inferExpirationOption(
        key.createdAt,
        key.expires ?? null
      );

      let expires: number | null;
      if (input.payload.expiration === currentExpiration) {
        expires = key.expires ?? null;
      } else if (input.payload.expiration === "never") {
        expires = null;
      } else {
        expires = Date.now() + (EXPIRATION_MS[input.payload.expiration] ?? 0);
      }

      await client.keys.updateKey({
        expires,
        keyId: input.payload.keyId,
        meta: {
          ...meta,
          permission: input.payload.permission,
        },
        name: input.payload.name,
        permissions: getPermissionsForLevel(input.payload.permission),
      });

      return { success: true };
    }),
  delete: authorizedProcedure
    .input(deleteKeyInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const { apiId, client } = requireUnkeyConfig();

      if (input.payload.keyId !== input.keyIdParam) {
        throw badRequest("Key ID mismatch");
      }

      const key = await findOrganizationKey(
        client,
        apiId,
        input.organizationId,
        input.payload.keyId
      );

      if (!key) {
        throw notFound("API key not found");
      }

      await client.keys.deleteKey({ keyId: input.payload.keyId });

      return { success: true };
    }),
};
