import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import {
  calculateTokenCostCents,
  shouldApplyMarkup,
} from "@notra/ai/billing/token-pricing";
import { useLogger, withEvlog } from "@notra/ai/evlog";
import {
  getGitHubIntegrationById,
  getGitHubToolRepositoryContextByIntegrationId,
} from "@notra/ai/integrations/github";
import {
  getLinearIntegrationById,
  getLinearToolContextByIntegrationId,
} from "@notra/ai/integrations/linear";
import { orchestrateChat } from "@notra/ai/orchestration/orchestrate";
import type { CheckResponse } from "autumn-js";
import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { chatRequestSchema } from "@/schemas/content";

interface RouteContext {
  params: Promise<{ organizationId: string; contentId: string }>;
}

export const maxDuration = 60;

export const POST = withEvlog(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const requestId = nanoid(10);
  const log = useLogger();

  try {
    const { organizationId, contentId } = await params;

    log.set({
      feature: "content_chat",
      organizationId,
      contentId,
      requestId,
    });

    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    let useMarkup = false;
    if (autumn) {
      console.log("[Autumn] Checking feature access:", {
        requestId,
        customerId: organizationId,
        featureId: FEATURES.AI_CREDITS,
      });

      let checkData: CheckResponse | null = null;
      try {
        checkData = await autumn.check({
          customerId: organizationId,
          featureId: FEATURES.AI_CREDITS,
        });
      } catch (checkError) {
        console.error("[Autumn] Check error:", {
          requestId,
          customerId: organizationId,
          error: checkError,
        });
        return NextResponse.json(
          { error: "Failed to check usage limits", code: "BILLING_ERROR" },
          { status: 500 }
        );
      }

      if (!checkData?.allowed) {
        console.log("[Autumn] Usage limit reached:", {
          requestId,
          customerId: organizationId,
          balance: checkData?.balance ?? 0,
        });
        return NextResponse.json(
          {
            error: "Usage limit reached",
            code: "USAGE_LIMIT_REACHED",
            balance: checkData?.balance ?? 0,
          },
          { status: 403 }
        );
      }

      useMarkup = shouldApplyMarkup(checkData?.balance ?? null);
    } else {
      console.log(
        "[Autumn] Skipping billing check - AUTUMN_SECRET_KEY not configured",
        { requestId }
      );
    }

    const body = await request.json();
    const parseResult = chatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const {
      messages,
      currentMarkdown,
      contentType,
      selection,
      context,
      timezone,
    } = parseResult.data;

    const autumnClient = autumn;

    const { stream, routingDecision } = await orchestrateChat(
      {
        organizationId,
        messages,
        currentMarkdown,
        contentType,
        selection,
        context,
        maxSteps: 50,
        log,
        timezone,
      },
      {
        integrationFetchers: {
          getGitHubIntegrationById,
          getLinearIntegrationById,
        },
        resolveContext: getGitHubToolRepositoryContextByIntegrationId,
        resolveLinearContext: getLinearToolContextByIntegrationId,
        async onUsage(usage, modelId) {
          if (!autumnClient) {
            return;
          }

          const costCents = calculateTokenCostCents(
            {
              inputTokens: usage.inputTokens ?? 0,
              outputTokens: usage.outputTokens ?? 0,
              totalTokens: usage.totalTokens ?? 0,
              cacheReadTokens: usage.inputTokenDetails?.cacheReadTokens ?? 0,
              cacheWriteTokens: usage.inputTokenDetails?.cacheWriteTokens ?? 0,
            },
            modelId,
            useMarkup
          );

          try {
            await autumnClient.track({
              customerId: organizationId,
              featureId: FEATURES.AI_CREDITS,
              value: costCents,
              properties: {
                source: "chat",
                content_id: contentId,
                model: modelId,
                input_tokens: usage.inputTokens ?? 0,
                output_tokens: usage.outputTokens ?? 0,
                cache_read_tokens:
                  usage.inputTokenDetails?.cacheReadTokens ?? 0,
                cache_write_tokens:
                  usage.inputTokenDetails?.cacheWriteTokens ?? 0,
                total_tokens: usage.totalTokens ?? 0,
                cost_cents: costCents,
              },
            });
          } catch (trackError) {
            console.error("[Autumn] Track error after chat completion:", {
              requestId,
              customerId: organizationId,
              error: trackError,
            });
          }
        },
        log,
      }
    );

    console.log("[Content Chat] Routing decision:", {
      requestId,
      decision: routingDecision,
    });

    return stream.toUIMessageStreamResponse({
      onError: (error) => {
        console.error("[Content Chat] Stream error:", { requestId, error });
        if (error instanceof Error) {
          return error.message;
        }
        return "An error occurred while processing your request.";
      },
    });
  } catch (e) {
    console.error("[Content Chat] Error:", {
      requestId,
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
});
