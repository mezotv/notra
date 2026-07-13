import {
  EVE_AGENT_ORGANIZATION_HEADER,
  EVE_AGENT_SERVICE_USERNAME,
} from "@notra/ai/constants/onboarding-agent";
import {
  SLACK_CHANNEL_NAME_MAX_LENGTH,
  SLACK_INVALID_CHANNEL_CHARS_REGEX,
} from "@notra/ai/constants/slack";
import { createSlackConnectChannelWithInvite } from "@notra/ai/integrations/slack";
import { triggerOnboardingAgent } from "@notra/ai/qstash/triggers";
import { onboardingProfileSchema } from "@notra/ai/schemas/onboarding-agent";
import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { getVercelOidcToken } from "@vercel/oidc";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { Effect } from "effect";
import { Client } from "eve/client";
import {
  AGENT_RUN_HARD_LIMIT_MS,
  SLACK_CHANNEL_PREFIX,
  SLACK_CHANNEL_SUFFIX,
  TRAILING_SLASH_PATTERN,
} from "@/constants/onboarding-agent";
import { buildOnboardingAgentMessage } from "@/lib/debug/onboarding-agent";
import {
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

async function createEveAgentClient(organizationId: string) {
  const clientOptions = {
    headers: { [EVE_AGENT_ORGANIZATION_HEADER]: organizationId },
    host: getEveOnboardingAgentUrl(),
    redirect: "error" as const,
  };

  try {
    const token = await getVercelOidcToken();
    if (token) {
      return new Client({
        ...clientOptions,
        auth: { vercelOidc: { token } },
      });
    }
  } catch {}

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
  const reserved = await db
    .update(organizations)
    .set({ onboardingAgentStartedAt: reservedAt })
    .where(
      and(
        eq(organizations.id, organizationId),
        eq(organizations.onboardingAgentRan, false),
        isNull(organizations.onboardingAgentStartedAt)
      )
    )
    .returning({ id: organizations.id });
  return reserved.length > 0 ? reservedAt : null;
}

export async function reserveOnboardingAgentRerun(
  organizationId: string
): Promise<Date | null> {
  const reservedAt = new Date();
  const staleBefore = new Date(reservedAt.getTime() - AGENT_RUN_HARD_LIMIT_MS);
  const reserved = await db
    .update(organizations)
    .set({ onboardingAgentRan: false, onboardingAgentStartedAt: reservedAt })
    .where(
      and(
        eq(organizations.id, organizationId),
        or(
          eq(organizations.onboardingAgentRan, true),
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
}: StartOnboardingAgentSessionInput) {
  const client = await createEveAgentClient(organizationId);
  const session = client.session();
  const response = await session.send({
    message: buildOnboardingAgentMessage(domain, organizationId),
    outputSchema: onboardingProfileSchema,
  });
  return { sessionId: response.sessionId };
}

export async function sendOnboardingSlackInvite({
  email,
  organizationSlug,
}: OnboardingSlackInviteInput): Promise<OnboardingSlackInviteResult> {
  if (!process.env.SLACK_BOT_TOKEN) {
    return { invited: false };
  }

  const channelName =
    `${SLACK_CHANNEL_PREFIX}${organizationSlug}${SLACK_CHANNEL_SUFFIX}`
      .toLowerCase()
      .replace(SLACK_INVALID_CHANNEL_CHARS_REGEX, "-")
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
