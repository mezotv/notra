import {
  EVE_AGENT_ORGANIZATION_HEADER,
  EVE_AGENT_RESERVATION_HEADER,
  EVE_AGENT_SERVICE_USERNAME,
} from "@notra/ai/constants/onboarding-agent";
import { createSlackConnectChannelWithInvite } from "@notra/ai/integrations/slack";
import { triggerOnboardingAgent } from "@notra/ai/qstash/triggers";
import { buildExternalChannelName } from "@notra/ai/utils/slack";
import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { getVercelOidcToken } from "@vercel/oidc";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { Effect } from "effect";
import { Client } from "eve/client";
import {
  AGENT_RUN_HARD_LIMIT_MS,
  EVE_CREATE_SESSION_ROUTE_PATH,
  EVE_SESSION_TASK_MODE,
  TRAILING_SLASH_PATTERN,
} from "@/constants/onboarding-agent";
import { buildOnboardingAgentMessage } from "@/lib/debug/onboarding-agent";
import {
  eveCreateSessionResponseSchema,
  OnboardingAgentCompensationError,
  OnboardingAgentTriggerError,
} from "@/schemas/onboarding-agent";
import type {
  LaunchReservedOnboardingAgentInput,
  OnboardingSlackInviteInput,
  OnboardingSlackInviteResult,
  StartOnboardingAgentSessionInput,
} from "@/types/onboarding-agent";

function getEveOnboardingAgentUrl() {
  const url = process.env.EVE_ONBOARDING_AGENT_URL;
  if (!url) {
    throw new Error("EVE_ONBOARDING_AGENT_URL is not configured");
  }
  return url.replace(TRAILING_SLASH_PATTERN, "");
}

async function createEveAgentClient(
  organizationId: string,
  reservedAt: string
) {
  const clientOptions = {
    headers: {
      [EVE_AGENT_ORGANIZATION_HEADER]: organizationId,
      [EVE_AGENT_RESERVATION_HEADER]: reservedAt,
    },
    host: getEveOnboardingAgentUrl(),
    redirect: "error" as const,
  };

  const token = await getVercelOidcToken().catch(() => null);
  if (token) {
    return new Client({
      ...clientOptions,
      auth: { vercelOidc: { token } },
    });
  }

  const password = process.env.EVE_ONBOARDING_AGENT_PASSWORD;
  if (password) {
    return new Client({
      ...clientOptions,
      auth: {
        basic: { password, username: EVE_AGENT_SERVICE_USERNAME },
      },
    });
  }

  return new Client(clientOptions);
}

export async function reserveInitialOnboardingAgentRun(
  organizationId: string
): Promise<Date | null> {
  const reservedAt = new Date();
  const staleBefore = new Date(reservedAt.getTime() - AGENT_RUN_HARD_LIMIT_MS);
  const reserved = await db
    .update(organizations)
    .set({ onboardingAgentStartedAt: reservedAt })
    .where(
      and(
        eq(organizations.id, organizationId),
        eq(organizations.onboardingAgentRan, false),
        or(
          isNull(organizations.onboardingAgentStartedAt),
          lt(organizations.onboardingAgentStartedAt, staleBefore)
        )
      )
    )
    .returning({ id: organizations.id });
  return reserved.length > 0 ? reservedAt : null;
}

export async function releaseOnboardingAgentReservation(
  organizationId: string,
  reservedAt: Date
): Promise<void> {
  await db
    .update(organizations)
    .set({ onboardingAgentStartedAt: null })
    .where(
      and(
        eq(organizations.id, organizationId),
        eq(organizations.onboardingAgentRan, false),
        eq(organizations.onboardingAgentStartedAt, reservedAt)
      )
    );
}

export const launchReservedOnboardingAgent = Effect.fn(
  "launchReservedOnboardingAgent"
)(function* ({ payload, reservedAt }: LaunchReservedOnboardingAgentInput) {
  const organizationId = payload.organizationId;
  return yield* Effect.tryPromise({
    try: () =>
      triggerOnboardingAgent({
        ...payload,
        reservedAt: reservedAt.toISOString(),
      }),
    catch: (cause) =>
      new OnboardingAgentTriggerError({ cause, organizationId }),
  }).pipe(
    Effect.catchTag("OnboardingAgentTriggerError", (triggerError) =>
      Effect.tryPromise({
        try: () =>
          releaseOnboardingAgentReservation(organizationId, reservedAt),
        catch: (cause) =>
          new OnboardingAgentCompensationError({
            cause,
            organizationId,
            triggerCause: triggerError.cause,
          }),
      }).pipe(Effect.flatMap(() => Effect.fail(triggerError)))
    )
  );
});

export async function startOnboardingAgentSession({
  organizationId,
  domain,
  reservedAt,
}: StartOnboardingAgentSessionInput) {
  const client = await createEveAgentClient(organizationId, reservedAt);
  const response = await client.fetch(EVE_CREATE_SESSION_ROUTE_PATH, {
    body: JSON.stringify({
      message: buildOnboardingAgentMessage(domain, organizationId),
      mode: EVE_SESSION_TASK_MODE,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to start onboarding agent session (${response.status}): ${body}`
    );
  }
  const payload = eveCreateSessionResponseSchema.parse(await response.json());
  return { sessionId: payload.sessionId };
}

export async function sendOnboardingSlackInvite({
  email,
  organizationName,
}: OnboardingSlackInviteInput): Promise<OnboardingSlackInviteResult> {
  if (!process.env.SLACK_BOT_TOKEN) {
    return { invited: false };
  }

  try {
    const channelName = buildExternalChannelName(organizationName);
    const result = await createSlackConnectChannelWithInvite({
      channelName,
      email,
    });
    return { channelId: result.channelId, invited: true };
  } catch (error) {
    console.error(
      `[Onboarding Agent] Slack Connect invite failed for ${organizationName}`,
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
