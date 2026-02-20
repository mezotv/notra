import { type NextRequest, NextResponse } from "next/server";
import { unkey } from "@/lib/api-keys/unkey";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { createApiKeySchema, EXPIRATION_MS } from "@/schemas/api-keys";

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
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

    const result = await unkey.apis.listKeys({
      apiId,
      externalId: organizationId,
    });

    const keysData = result.data ?? [];
    const keys = keysData.map((key) => {
      const meta = key.meta ?? {};
      return {
        keyId: key.keyId,
        name: key.name ?? "Unnamed",
        start: key.start,
        createdAt: key.createdAt,
        expires: key.expires ?? null,
        enabled: key.enabled,
        permission: meta.permission ?? "api.read",
        createdBy: meta.createdBy ?? null,
      };
    });

    return NextResponse.json(keys);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
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

    const body = await request.json();
    const validation = createApiKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, permission, expiration } = validation.data;

    const apiId = process.env.UNKEY_API_ID;
    if (!apiId) {
      return NextResponse.json(
        { error: "API key service is not configured" },
        { status: 503 }
      );
    }

    const expiresMs = EXPIRATION_MS[expiration];
    const expires = expiresMs ? Date.now() + expiresMs : undefined;

    const created = await unkey.keys.createKey({
      apiId,
      prefix: "ntra",
      name,
      externalId: organizationId,
      expires,
      permissions: [permission],
      meta: { permission, createdBy: auth.context.user.name },
    });

    const fullKey = created.data?.key;
    const keyId = created.data?.keyId;

    if (!fullKey || !keyId) {
      return NextResponse.json(
        { error: "Failed to create API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      keyId,
      name,
      key: fullKey,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
