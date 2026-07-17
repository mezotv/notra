import { type NextRequest, NextResponse } from "next/server";
import {
  consumeCliSessionKey,
  initializeCliSession,
} from "@/lib/cli-auth/storage";
import {
  cliPollSecretSchema,
  cliSessionIdSchema,
  initializeCliSessionSchema,
} from "@/schemas/cli-auth";
import type {
  CliInitializeResponse,
  CliPollResponse,
} from "@/types/cli-auth/poll";
import { hashCliPollSecret } from "@/utils/cli-auth";
import {
  cliSessionInitializeRatelimit,
  cliSessionPollSecretRatelimit,
  cliSessionPollSessionRatelimit,
  enforceCliSessionRatelimit,
} from "@/utils/cli-auth-ratelimit";
import { getClientIp } from "@/utils/ratelimit";

const BEARER_SECRET_REGEX = /^Bearer\s+(.+)$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const sessionIdParse = cliSessionIdSchema.safeParse(sessionId);
  if (!sessionIdParse.success) {
    return NextResponse.json<CliPollResponse>(
      { status: "expired" },
      { status: 400 }
    );
  }

  const authorization = request.headers.get("authorization");
  const pollSecretParse = cliPollSecretSchema.safeParse(
    authorization?.match(BEARER_SECRET_REGEX)?.[1]
  );
  if (!pollSecretParse.success) {
    return NextResponse.json<CliPollResponse>(
      { status: "expired" },
      { status: 401 }
    );
  }

  const sessionRateLimited = await enforceCliSessionRatelimit(
    cliSessionPollSessionRatelimit,
    sessionIdParse.data
  );
  if (sessionRateLimited) {
    return sessionRateLimited;
  }

  const secretRateLimited = await enforceCliSessionRatelimit(
    cliSessionPollSecretRatelimit,
    `${sessionIdParse.data}:${hashCliPollSecret(pollSecretParse.data)}`
  );
  if (secretRateLimited) {
    return secretRateLimited;
  }

  const result = await consumeCliSessionKey(
    sessionIdParse.data,
    pollSecretParse.data
  );
  if (result.status === "pending") {
    return NextResponse.json<CliPollResponse>(result, { status: 202 });
  }
  if (result.status === "expired") {
    return NextResponse.json<CliPollResponse>(result, { status: 410 });
  }
  return NextResponse.json<CliPollResponse>(result, { status: 200 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const sessionIdParse = cliSessionIdSchema.safeParse(sessionId);
  if (!sessionIdParse.success) {
    return NextResponse.json<CliInitializeResponse>(
      { error: "Invalid CLI session id" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const bodyParse = initializeCliSessionSchema.safeParse(body);
  if (!bodyParse.success) {
    return NextResponse.json<CliInitializeResponse>(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const rateLimited = await enforceCliSessionRatelimit(
    cliSessionInitializeRatelimit,
    getClientIp(request)
  );
  if (rateLimited) {
    return rateLimited;
  }

  const created = await initializeCliSession(
    sessionIdParse.data,
    bodyParse.data.pollSecretHash
  );
  if (!created) {
    return NextResponse.json<CliInitializeResponse>(
      { error: "CLI session already initialized" },
      { status: 409 }
    );
  }

  return NextResponse.json<CliInitializeResponse>(
    { status: "pending" },
    { status: 201 }
  );
}
