import { type NextRequest, NextResponse } from "next/server";
import { unkey } from "@/lib/api-keys/unkey";
import { withOrganizationAuth } from "@/lib/auth/organization";
import {
  deleteApiKeySchema,
  EXPIRATION_MS,
  updateApiKeySchema,
} from "@/schemas/api-keys";

interface RouteContext {
  params: Promise<{ organizationId: string; keyId: string }>;
}

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

async function findOrganizationKey(
  apiId: string,
  organizationId: string,
  keyId: string
) {
  const keysResult = await unkey?.apis.listKeys({
    apiId,
    externalId: organizationId,
  });

  const keys = keysResult?.data ?? [];
  return keys.find((key) => key.keyId === keyId) ?? null;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, keyId: keyIdParam } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    if (!unkey) {
      return NextResponse.json(
        { error: "API key service is not configured" },
        { status: 503 }
      );
    }

    const apiId = process.env.UNKEY_API_ID;
    if (!apiId) {
      return NextResponse.json(
        { error: "API key service is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validation = updateApiKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { keyId, name, permission, expiration } = validation.data;

    if (keyId !== keyIdParam) {
      return NextResponse.json({ error: "Key ID mismatch" }, { status: 400 });
    }

    const key = await findOrganizationKey(apiId, organizationId, keyId);
    if (!key) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
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
    if (expiration === currentExpiration) {
      expires = key.expires ?? null;
    } else if (expiration === "never") {
      expires = null;
    } else {
      expires = Date.now() + (EXPIRATION_MS[expiration] ?? 0);
    }

    await unkey.keys.updateKey({
      keyId,
      name,
      permissions: [permission],
      expires,
      meta: {
        ...meta,
        permission,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, keyId: keyIdParam } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    if (!unkey) {
      return NextResponse.json(
        { error: "API key service is not configured" },
        { status: 503 }
      );
    }

    const apiId = process.env.UNKEY_API_ID;
    if (!apiId) {
      return NextResponse.json(
        { error: "API key service is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validation = deleteApiKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { keyId } = validation.data;
    if (keyId !== keyIdParam) {
      return NextResponse.json({ error: "Key ID mismatch" }, { status: 400 });
    }

    const key = await findOrganizationKey(apiId, organizationId, keyId);
    if (!key) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    await unkey.keys.deleteKey({ keyId });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
