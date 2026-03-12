import type { NextRequest } from "next/server";
import {
  getGitHubIntegrationById,
  getRepositoryById,
} from "@/lib/services/github-integration";
import { handleGitHubWebhook } from "@/lib/webhooks/github";
import { handleLinearWebhook } from "@/lib/webhooks/linear";
import type { InputIntegrationType } from "@/schemas/integrations";
import { webhookParamsWithRepoSchema } from "@/schemas/webhooks";
import type { WebhookContext, WebhookHandler } from "@/types/webhooks/webhooks";

interface RouteContext {
  params: Promise<{
    provider: string;
    organizationId: string;
    integrationId: string;
    repositoryId: string;
  }>;
}

const WEBHOOK_HANDLERS: Record<InputIntegrationType, WebhookHandler | null> = {
  github: handleGitHubWebhook,
  linear: handleLinearWebhook,
  slack: null,
};

type IntegrationFetcher = (
  integrationId: string
) => Promise<{ organizationId: string; enabled: boolean } | null | undefined>;

const INTEGRATION_FETCHERS: Record<
  InputIntegrationType,
  IntegrationFetcher | null
> = {
  github: async (integrationId) => {
    const integration = await getGitHubIntegrationById(integrationId);
    if (!integration) {
      return null;
    }
    return {
      organizationId: integration.organizationId,
      enabled: integration.enabled,
    };
  },
  linear: null,
  slack: null,
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const rawParams = await params;

  const validation = webhookParamsWithRepoSchema.safeParse(rawParams);
  if (!validation.success) {
    return Response.json(
      {
        error: "Invalid webhook parameters",
        details: validation.error.issues,
      },
      { status: 400 }
    );
  }

  const { provider, organizationId, integrationId, repositoryId } =
    validation.data;

  const fetcher = INTEGRATION_FETCHERS[provider];
  if (!fetcher) {
    return Response.json(
      { error: `Provider ${provider} is not yet supported` },
      { status: 501 }
    );
  }

  try {
    const integration = await fetcher(integrationId);

    if (!integration) {
      return Response.json({ error: "Integration not found" }, { status: 404 });
    }

    if (integration.organizationId !== organizationId) {
      return Response.json(
        { error: "Integration does not belong to this organization" },
        { status: 403 }
      );
    }

    if (!integration.enabled) {
      return Response.json(
        { error: "Integration is disabled" },
        { status: 403 }
      );
    }

    // Verify repository belongs to this integration
    const repository = await getRepositoryById(repositoryId);
    if (!repository) {
      return Response.json({ error: "Repository not found" }, { status: 404 });
    }

    if (repository.integration.id !== integrationId) {
      return Response.json(
        { error: "Repository does not belong to this integration" },
        { status: 403 }
      );
    }

    const handler = WEBHOOK_HANDLERS[provider];
    if (!handler) {
      return Response.json(
        { error: `Webhook handler for ${provider} is not yet implemented` },
        { status: 501 }
      );
    }

    const rawBody = await request.text();

    const context: WebhookContext = {
      provider,
      organizationId,
      integrationId,
      repositoryId,
      request,
      rawBody,
    };

    return await handler(context);
  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json(
      { error: "Internal server error processing webhook" },
      { status: 500 }
    );
  }
}
