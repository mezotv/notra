import { createHmac, timingSafeEqual } from "node:crypto";
import { checkLogRetention } from "@/lib/billing/check-log-retention";
import { getDecryptedLinearWebhookSecret } from "@/lib/services/linear-integration";
import { appendWebhookLog } from "@/lib/webhooks/logging";
import type {
  LinearWebhookPayload,
  WebhookContext,
} from "@/types/webhooks/webhooks";

export async function handleLinearWebhook(
  context: WebhookContext
): Promise<Response> {
  const { request, rawBody, organizationId, integrationId } = context;

  const signature = request.headers.get("linear-signature");

  if (!signature) {
    await appendWebhookLog({
      organizationId,
      integrationId,
      integrationType: "linear",
      title: "Missing Linear signature",
      status: "failed",
      statusCode: 400,
      referenceId: null,
      errorMessage: "Missing Linear-Signature header",
    });

    return Response.json(
      { error: "Missing Linear-Signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = await getDecryptedLinearWebhookSecret(integrationId);
  if (!webhookSecret) {
    return Response.json(
      { error: "Webhook secret not configured for this integration" },
      { status: 500 }
    );
  }

  const expected = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const isValid =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!isValid) {
    await appendWebhookLog({
      organizationId,
      integrationId,
      integrationType: "linear",
      title: "Invalid webhook signature",
      status: "failed",
      statusCode: 401,
      referenceId: null,
      errorMessage: "Linear webhook signature verification failed",
    });

    return Response.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  let payload: LinearWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LinearWebhookPayload;
  } catch {
    await appendWebhookLog({
      organizationId,
      integrationId,
      integrationType: "linear",
      title: "Invalid webhook payload",
      status: "failed",
      statusCode: 400,
      referenceId: null,
      errorMessage: "Could not parse webhook payload",
    });

    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const logRetentionDays = await checkLogRetention(organizationId);

  const eventTitle = payload.type
    ? `Linear ${payload.type} ${payload.action ?? "event"}`
    : "Linear webhook received";

  await appendWebhookLog({
    organizationId,
    integrationId,
    integrationType: "linear",
    title: eventTitle,
    status: "success",
    statusCode: 200,
    referenceId: null,
    payload: {
      action: payload.action,
      type: payload.type,
      hasSignature: true,
    },
    retentionDays: logRetentionDays,
  });

  return Response.json({ message: "Received Linear webhook" });
}
