import { redis } from "@notra/ai/utils/redis";
import {
  AGENT_FEEDBACK_TOKEN_GENERATION_CACHE_PREFIX,
  AGENT_FEEDBACK_TOKEN_GENERATION_CACHE_TTL_SECONDS,
  AGENT_FEEDBACK_TOKEN_MISSING_CACHE_TTL_SECONDS,
  AGENT_FEEDBACK_TOKEN_PREFIX,
  AGENT_FEEDBACK_TOKEN_SECRET_ENV,
} from "@notra/db/constants/agent-feedback";
import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { buildIngestToken } from "@notra/utils/ingest-token";
import { eq, sql } from "drizzle-orm";
import { Effect } from "effect";
import { AGENT_FEEDBACK_TOKEN_GENERATION_MISSING } from "@/constants/agent-feedback";
import { agentFeedbackDb } from "@/lib/agent-feedback/effect";
import {
  AgentFeedbackOrganizationNotFoundError,
  AgentFeedbackTokenUnavailableError,
} from "@/lib/agent-feedback/errors";
import type {
  AgentFeedbackGenerationCacheMode,
  AgentFeedbackOrganizationTokenState,
  AgentFeedbackTokenResult,
} from "@/types/agent-feedback";

function generationCacheKey(organizationId: string): string {
  return `${AGENT_FEEDBACK_TOKEN_GENERATION_CACHE_PREFIX}:${organizationId}`;
}

function getFeedbackIngestSecret(): string | null {
  const secret = process.env[AGENT_FEEDBACK_TOKEN_SECRET_ENV];
  return secret && secret.length > 0 ? secret : null;
}

async function cacheGeneration(
  organizationId: string,
  value: number | null,
  mode: AgentFeedbackGenerationCacheMode
): Promise<void> {
  if (!redis) {
    return;
  }
  const key = generationCacheKey(organizationId);
  const cached =
    value === null ? AGENT_FEEDBACK_TOKEN_GENERATION_MISSING : value;
  const ex =
    value === null
      ? AGENT_FEEDBACK_TOKEN_MISSING_CACHE_TTL_SECONDS
      : AGENT_FEEDBACK_TOKEN_GENERATION_CACHE_TTL_SECONDS;
  const write =
    mode === "fill"
      ? redis.set(key, cached, { ex, nx: true })
      : redis.set(key, cached, { ex });
  await write.catch(() => null);
}

async function readOrganization(
  organizationId: string
): Promise<AgentFeedbackOrganizationTokenState | null> {
  const row = await db.query.organizations.findFirst({
    columns: { feedbackIngestTokenGeneration: true, name: true },
    where: eq(organizations.id, organizationId),
  });
  await cacheGeneration(
    organizationId,
    row?.feedbackIngestTokenGeneration ?? null,
    "fill"
  );
  return row
    ? { generation: row.feedbackIngestTokenGeneration, name: row.name }
    : null;
}

async function bumpGeneration(
  organizationId: string
): Promise<AgentFeedbackOrganizationTokenState | null> {
  const [row] = await db
    .update(organizations)
    .set({
      feedbackIngestTokenGeneration: sql`${organizations.feedbackIngestTokenGeneration} + 1`,
    })
    .where(eq(organizations.id, organizationId))
    .returning({
      generation: organizations.feedbackIngestTokenGeneration,
      name: organizations.name,
    });
  await cacheGeneration(organizationId, row?.generation ?? null, "overwrite");
  return row ?? null;
}

function toTokenResult(
  secret: string,
  organizationId: string,
  state: AgentFeedbackOrganizationTokenState
): AgentFeedbackTokenResult {
  return {
    token: buildIngestToken({
      secret,
      prefix: AGENT_FEEDBACK_TOKEN_PREFIX,
      organizationId,
      generation: state.generation,
    }),
    organizationName: state.name,
  };
}

export const buildAgentFeedbackToken = Effect.fn("agentFeedback.buildToken")(
  function* (organizationId: string) {
    const secret = getFeedbackIngestSecret();
    if (!secret) {
      return yield* Effect.fail(new AgentFeedbackTokenUnavailableError({}));
    }
    const state = yield* agentFeedbackDb("readOrganization", () =>
      readOrganization(organizationId)
    );
    if (state === null) {
      return yield* Effect.fail(
        new AgentFeedbackOrganizationNotFoundError({ organizationId })
      );
    }
    return toTokenResult(secret, organizationId, state);
  }
);

export const rotateAgentFeedbackToken = Effect.fn("agentFeedback.rotateToken")(
  function* (organizationId: string) {
    const secret = getFeedbackIngestSecret();
    if (!secret) {
      return yield* Effect.fail(new AgentFeedbackTokenUnavailableError({}));
    }
    const state = yield* agentFeedbackDb("bumpGeneration", () =>
      bumpGeneration(organizationId)
    );
    if (state === null) {
      return yield* Effect.fail(
        new AgentFeedbackOrganizationNotFoundError({ organizationId })
      );
    }
    return toTokenResult(secret, organizationId, state);
  }
);
