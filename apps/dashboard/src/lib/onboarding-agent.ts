import { createSlackConnectChannelWithInvite } from "@notra/ai/integrations/slack";
import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import {
  EVE_AGENT_ORGANIZATION_HEADER,
  EVE_AGENT_SERVICE_USERNAME,
  SLACK_CHANNEL_NAME_MAX_LENGTH,
  SLACK_CHANNEL_PREFIX,
} from "@/constants/onboarding-agent";
import { buildOnboardingAgentMessage } from "@/lib/debug/onboarding-agent";
import { eveSessionResponseSchema } from "@/schemas/onboarding-agent";
import type {
  OnboardingSlackInviteInput,
  OnboardingSlackInviteResult,
  StartOnboardingAgentSessionInput,
} from "@/types/onboarding-agent";

const TRAILING_SLASH_PATTERN = /\/$/;
const SLACK_CHANNEL_INVALID_CHARS_PATTERN = /[^a-z0-9_-]/g;

function getEveOnboardingAgentUrl() {
  const url = process.env.EVE_ONBOARDING_AGENT_URL;
  if (!url) {
    throw new Error("EVE_ONBOARDING_AGENT_URL is not configured");
  }
  return url.replace(TRAILING_SLASH_PATTERN, "");
}

function buildEveAgentHeaders(organizationId: string): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    [EVE_AGENT_ORGANIZATION_HEADER]: organizationId,
  };
  const oidcToken = process.env.VERCEL_OIDC_TOKEN;
  if (oidcToken) {
    headers.authorization = `Bearer ${oidcToken}`;
    return headers;
  }
  const password = process.env.EVE_ONBOARDING_AGENT_PASSWORD;
  if (password) {
    const credentials = Buffer.from(
      `${EVE_AGENT_SERVICE_USERNAME}:${password}`
    ).toString("base64");
    headers.authorization = `Basic ${credentials}`;
  }
  return headers;
}

export async function startOnboardingAgentSession({
  organizationId,
  domain,
}: StartOnboardingAgentSessionInput) {
  const response = await fetch(`${getEveOnboardingAgentUrl()}/eve/v1/session`, {
    body: JSON.stringify({
      message: buildOnboardingAgentMessage(domain, organizationId),
    }),
    headers: buildEveAgentHeaders(organizationId),
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(
      `Failed to start the onboarding agent session: status ${response.status}`
    );
  }

  const { sessionId } = eveSessionResponseSchema.parse(await response.json());

  await db
    .update(organizations)
    .set({ onboardingAgentRan: false, onboardingAgentStartedAt: new Date() })
    .where(eq(organizations.id, organizationId));

  return { sessionId };
}

export async function sendOnboardingSlackInvite({
  email,
  organizationSlug,
}: OnboardingSlackInviteInput): Promise<OnboardingSlackInviteResult> {
  if (!process.env.SLACK_BOT_TOKEN) {
    return { invited: false };
  }

  const channelName = `${SLACK_CHANNEL_PREFIX}${organizationSlug}`
    .toLowerCase()
    .replace(SLACK_CHANNEL_INVALID_CHARS_PATTERN, "-")
    .slice(0, SLACK_CHANNEL_NAME_MAX_LENGTH);

  try {
    const result = await createSlackConnectChannelWithInvite({
      channelName,
      email,
    });
    return { channelId: result.channelId, invited: true };
  } catch (error) {
    console.error(
      `[Onboarding Agent] Slack Connect invite failed for ${organizationSlug}`,
      error
    );
    return { invited: false };
  }
}

export async function getOnboardingAgentState(organizationId: string) {
  const organization = await db.query.organizations.findFirst({
    columns: { onboardingAgentRan: true, onboardingAgentStartedAt: true },
    where: eq(organizations.id, organizationId),
  });
  return {
    ran: organization?.onboardingAgentRan ?? false,
    startedAt: organization?.onboardingAgentStartedAt ?? null,
  };
}
