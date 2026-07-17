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
import { revokeCreatedCliApiKey } from "@/lib/cli-auth/revoke-created-key";
import {
  getCliSessionPollSecretHash,
  storeCliSessionKey,
} from "@/lib/cli-auth/storage";
import {
  authorizeCliSessionSchema,
  cliSessionIdSchema,
} from "@/schemas/cli-auth";
import { verifyCliVerificationCode } from "@/utils/cli-auth";
import {
  cliSessionAuthorizeRatelimit,
  enforceCliSessionRatelimit,
} from "@/utils/cli-auth-ratelimit";

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

  const rateLimited = await enforceCliSessionRatelimit(
    cliSessionAuthorizeRatelimit,
    session.user.id
  );
  if (rateLimited) {
    return rateLimited;
  }

  const pollSecretHash = await getCliSessionPollSecretHash(sessionIdParse.data);
  if (!pollSecretHash) {
    return NextResponse.json({ error: "CLI session expired" }, { status: 410 });
  }

  if (
    !verifyCliVerificationCode(pollSecretHash, bodyParse.data.verificationCode)
  ) {
    return NextResponse.json(
      { error: "Verification code does not match the CLI session" },
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
  const keyId = created.data?.keyId;
  if (!(fullKey && keyId)) {
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }

  let stored = false;
  let storageFailed = false;
  try {
    stored = await storeCliSessionKey(sessionIdParse.data, fullKey);
  } catch (storageError) {
    storageFailed = true;
    console.error("[CLI Auth] Failed to store API key handoff:", {
      keyId,
      error: storageError,
    });
  }

  if (!stored) {
    const revoked = await revokeCreatedCliApiKey(keyId);
    if (!revoked || storageFailed) {
      return NextResponse.json(
        { error: "Failed to complete CLI authorization safely" },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "CLI session expired" }, { status: 410 });
  }

  return NextResponse.json({ status: "ok" });
}
