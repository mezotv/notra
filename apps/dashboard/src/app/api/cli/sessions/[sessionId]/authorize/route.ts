import { ORPCError } from "@orpc/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getPermissionsForLevel } from "@/lib/api-keys/permissions";
import { unkey } from "@/lib/api-keys/unkey";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { getServerSession } from "@/lib/auth/session";
import { assertActiveSubscription } from "@/lib/billing/subscription";
import {
  CLI_API_KEY_PREFIX,
  CLI_API_KEY_SOURCE_TAG,
  CLI_API_KEY_TTL_MS,
} from "@/lib/cli-auth/constants";
import {
  getCliSessionPollSecretHash,
  storeCliSessionKey,
} from "@/lib/cli-auth/storage";
import {
  authorizeCliSessionSchema,
  cliSessionIdSchema,
} from "@/schemas/cli-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const sessionIdParse = cliSessionIdSchema.safeParse(sessionId);
  if (!sessionIdParse.success) {
    return NextResponse.json(
      { error: "Invalid CLI session id" },
      { status: 400 }
    );
  }

  const requestHeaders = await headers();
  const session = await getServerSession({ headers: requestHeaders });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pollSecretHash = await getCliSessionPollSecretHash(sessionIdParse.data);
  if (!pollSecretHash) {
    return NextResponse.json({ error: "CLI session expired" }, { status: 410 });
  }

  const bodyParse = authorizeCliSessionSchema.safeParse(body);
  if (!bodyParse.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: bodyParse.error.issues,
      },
      { status: 400 }
    );
  }

  try {
    await assertOrganizationAccess({
      headers: requestHeaders,
      organizationId: bodyParse.data.organizationId,
      user: session.user,
    });
    await assertActiveSubscription(bodyParse.data.organizationId);
  } catch (error) {
    if (error instanceof ORPCError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    throw error;
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

  const created = await unkey.keys.createKey({
    apiId,
    expires: Date.now() + CLI_API_KEY_TTL_MS,
    externalId: bodyParse.data.organizationId,
    meta: {
      createdBy: session.user.name,
      permission: "api.write",
      source: CLI_API_KEY_SOURCE_TAG,
    },
    name: bodyParse.data.name,
    permissions: getPermissionsForLevel("api.write"),
    prefix: CLI_API_KEY_PREFIX,
  });

  const fullKey = created.data?.key;
  if (!fullKey) {
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }

  const stored = await storeCliSessionKey(sessionIdParse.data, fullKey);
  if (!stored) {
    const keyId = created.data?.keyId;
    if (keyId) {
      await unkey.keys.deleteKey({ keyId });
    }
    return NextResponse.json({ error: "CLI session expired" }, { status: 410 });
  }

  return NextResponse.json({ status: "ok" });
}
