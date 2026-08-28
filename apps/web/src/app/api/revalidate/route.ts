import { NextResponse } from "next/server";

import { marbleWebhookPayloadSchema } from "@/schemas/marble-webhook";
import {
  handleMarbleWebhookEvent,
  revalidateMarbleContent,
  verifyMarbleSignature,
} from "@/utils/marble-webhook";
import { getManualRevalidateParams, jsonError } from "@/utils/revalidate-route";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.MARBLE_WEBHOOK_SECRET;
  const token = new URL(request.url).searchParams.get("secret");

  if (!(secret && token && token === secret)) {
    return jsonError("Invalid secret", 401);
  }

  return NextResponse.json(
    revalidateMarbleContent(getManualRevalidateParams(request))
  );
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-marble-signature");
  const secret = process.env.MARBLE_WEBHOOK_SECRET;

  if (!(secret && signature)) {
    return jsonError("Secret or signature missing", 400);
  }

  const bodyText = await request.text();

  if (!verifyMarbleSignature(secret, signature, bodyText)) {
    return jsonError("Invalid signature", 400);
  }

  let rawPayload: unknown;

  try {
    rawPayload = JSON.parse(bodyText);
  } catch {
    return jsonError("Invalid JSON payload", 400);
  }

  const parsed = marbleWebhookPayloadSchema.safeParse(rawPayload);

  if (!parsed.success) {
    return jsonError("Invalid payload structure", 400);
  }

  const payload = parsed.data;

  if (!((payload.event ?? payload.type) && payload.data)) {
    return jsonError("Invalid payload structure", 400);
  }

  try {
    return NextResponse.json(handleMarbleWebhookEvent(payload));
  } catch (error) {
    console.error("Failed to process Marble webhook", error);
    return jsonError("Failed to process webhook", 500);
  }
}
