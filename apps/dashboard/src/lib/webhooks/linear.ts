import { checkLogRetention } from "@/lib/billing/check-log-retention";
import { appendWebhookLog } from "@/lib/webhooks/logging";
import type { WebhookContext } from "@/types/webhooks/webhooks";

interface LinearWebhookPayload {
  action: string;
  type: string;
  data?: Record<string, unknown>;
}

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
