import { orchestrateChat } from "@notra/ai/orchestration/orchestrate";
import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { FEATURES } from "@/constants/features";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { autumn } from "@/lib/billing/autumn";
import {
  getGitHubIntegrationById,
  getGitHubToolRepositoryContextByIntegrationId,
} from "@/lib/services/github-integration";
import {
  getLinearIntegrationById,
  getLinearToolContextByIntegrationId,
} from "@/lib/services/linear-integration";
import { chatRequestSchema } from "@/schemas/content";
import type { AutumnCheckResponse } from "@/types/autumn";

interface RouteContext {
  params: Promise<{ organizationId: string; contentId: string }>;
}

export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: RouteContext) {
  const requestId = nanoid(10);

  try {
    const { organizationId } = await params;

    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    // Check billing if Autumn is configured
    if (autumn) {
      console.log("[Autumn] Checking feature access:", {
        requestId,
        customerId: organizationId,
        featureId: FEATURES.AI_CREDITS,
      });

      let checkData: AutumnCheckResponse | null = null;
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

    const { messages, currentMarkdown, contentType, selection, context } =
      parseResult.data;

    let tracked = false;
    if (autumn) {
      try {
        await autumn.track({
          customerId: organizationId,
          featureId: FEATURES.AI_CREDITS,
          value: 1,
        });
        tracked = true;
      } catch (trackError) {
        console.error("[Autumn] Track error:", {
          requestId,
          customerId: organizationId,
          error: trackError,
        });
      }
    }

    try {
      const { stream, routingDecision } = await orchestrateChat(
        {
          organizationId,
          messages,
          currentMarkdown,
          contentType,
          selection,
          context,
          maxSteps: 5,
        },
        {
          integrationFetchers: {
            getGitHubIntegrationById,
            getLinearIntegrationById,
          },
          resolveContext: getGitHubToolRepositoryContextByIntegrationId,
          resolveLinearContext: getLinearToolContextByIntegrationId,
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
    } catch (orchestrationError) {
      if (tracked && autumn) {
        try {
          await autumn.track({
            customerId: organizationId,
            featureId: FEATURES.AI_CREDITS,
            value: 0,
          });
          console.log(
            "[Autumn] Usage compensated after orchestration failure:",
            {
              requestId,
            }
          );
        } catch (refundError) {
          console.error("[Autumn] Failed to compensate usage:", {
            requestId,
            customerId: organizationId,
            error: refundError,
          });
        }
      }
      throw orchestrationError;
    }
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
}
