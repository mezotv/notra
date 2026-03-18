import { createContentGenerationRequestSchema } from "@notra/content-generation/schemas";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { FEATURES } from "@/constants/features";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { autumn } from "@/lib/billing/autumn";
import { addActiveGeneration, generateRunId } from "@/lib/generations/tracking";
import { triggerOnDemandContent } from "@/lib/triggers/qstash";

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { organizationId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);

  if (!auth.success) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const bodyValidation = createContentGenerationRequestSchema.safeParse(body);

  if (!bodyValidation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: bodyValidation.error.issues,
      },
      { status: 400 }
    );
  }

  const {
    contentType,
    lookbackWindow,
    repositoryIds,
    integrations,
    selectedItems,
    brandIdentityId,
    brandVoiceId,
    dataPoints,
  } = bodyValidation.data;

  if (dataPoints.includeLinearIssues) {
    return NextResponse.json(
      {
        error:
          "Linear Issues are not supported in manual content generation yet.",
      },
      { status: 400 }
    );
  }

  if (
    !dataPoints.includePullRequests &&
    !dataPoints.includeCommits &&
    !dataPoints.includeReleases
  ) {
    return NextResponse.json(
      {
        error:
          "At least one data source (Pull Requests, Commits, or Releases) must be enabled.",
      },
      { status: 400 }
    );
  }

  let aiCreditReserved = false;

  if (autumn) {
    const { data, error } = await autumn.check({
      customer_id: organizationId,
      feature_id: FEATURES.AI_CREDITS,
      required_balance: 1,
      send_event: true,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to verify AI credits" },
        { status: 500 }
      );
    }

    if (!data?.allowed) {
      return NextResponse.json(
        { error: "AI credit limit reached" },
        { status: 402 }
      );
    }

    aiCreditReserved = true;
  }

  const runId = generateRunId("manual_on_demand");

  await addActiveGeneration(organizationId, {
    runId,
    triggerId: "manual_on_demand",
    outputType: contentType,
    triggerName: contentType,
    startedAt: new Date().toISOString(),
    source: "dashboard",
  });

  await triggerOnDemandContent({
    organizationId,
    runId,
    contentType,
    lookbackWindow,
    repositoryIds: repositoryIds ?? integrations?.github,
    brandVoiceId: brandIdentityId ?? brandVoiceId,
    dataPoints,
    selectedItems,
    aiCreditReserved,
    source: "dashboard",
  });

  return NextResponse.json({ success: true, runId }, { status: 202 });
}
