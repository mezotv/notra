import {
  AGENT_FEEDBACK_TOKEN_GENERATION_CACHE_PREFIX,
  AGENT_FEEDBACK_TOKEN_GENERATION_CACHE_TTL_SECONDS,
  AGENT_FEEDBACK_TOKEN_MISSING_CACHE_TTL_SECONDS,
  AGENT_FEEDBACK_TOKEN_PREFIX,
} from "@notra/db/constants/agent-feedback";
import { organizations, projects } from "@notra/db/schema";
import { verifyIngestToken } from "@notra/utils/ingest-token";
import type { IngestTokenIdentity } from "@notra/utils/types/ingest-token";
import { and, eq } from "drizzle-orm";
import type { Context } from "hono";

import {
  FEEDBACK_INGEST_SCOPE,
  FEEDBACK_TOKEN_GENERATION_MISSING,
  FEEDBACK_TOKEN_INVALID_ERROR,
  FEEDBACK_TOKEN_REVOKED_ERROR,
  FEEDBACK_TOKEN_SCOPE_ERROR,
  FEEDBACK_TOKEN_UNAVAILABLE_ERROR,
} from "../constants/feedback";
import type { FeedbackTokenVerification } from "../types/feedback";
import { getRedis } from "./redis";

function generationCacheKey(organizationId: string) {
  return `${AGENT_FEEDBACK_TOKEN_GENERATION_CACHE_PREFIX}:${organizationId}`;
}

async function getTokenGeneration(
  c: Context,
  organizationId: string
): Promise<number | null> {
  const redis = getRedis(c.env);
  if (redis) {
    const cached = await redis
      .get<string | number>(generationCacheKey(organizationId))
      .catch(() => null);
    if (cached === FEEDBACK_TOKEN_GENERATION_MISSING) {
      return null;
    }
    const parsed = typeof cached === "number" ? cached : Number(cached);
    if (Number.isInteger(parsed) && parsed >= 1) {
      return parsed;
    }
  }

  const row = await c.get("db").query.organizations.findFirst({
    columns: { feedbackIngestTokenGeneration: true },
    where: eq(organizations.id, organizationId),
  });
  const generation = row?.feedbackIngestTokenGeneration ?? null;

  if (redis) {
    await redis
      .set(
        generationCacheKey(organizationId),
        generation === null ? FEEDBACK_TOKEN_GENERATION_MISSING : generation,
        {
          ex:
            generation === null
              ? AGENT_FEEDBACK_TOKEN_MISSING_CACHE_TTL_SECONDS
              : AGENT_FEEDBACK_TOKEN_GENERATION_CACHE_TTL_SECONDS,
          nx: true,
        }
      )
      .catch(() => null);
  }

  return generation;
}

async function projectBelongsToOrganization(
  c: Context,
  identity: IngestTokenIdentity
): Promise<boolean> {
  if (!identity.projectId) {
    return true;
  }
  const project = await c.get("db").query.projects.findFirst({
    columns: { id: true },
    where: and(
      eq(projects.id, identity.projectId),
      eq(projects.organizationId, identity.organizationId)
    ),
  });
  return project !== undefined;
}

export function isFeedbackToken(token: string): boolean {
  return token.startsWith(AGENT_FEEDBACK_TOKEN_PREFIX);
}

export async function verifyFeedbackToken(
  c: Context,
  token: string,
  requiredScope?: string
): Promise<FeedbackTokenVerification> {
  const secret = c.env.FEEDBACK_INGEST_SECRET;
  if (!secret) {
    return {
      success: false,
      error: FEEDBACK_TOKEN_UNAVAILABLE_ERROR,
      status: 503,
    };
  }

  if (requiredScope !== FEEDBACK_INGEST_SCOPE) {
    return { success: false, error: FEEDBACK_TOKEN_SCOPE_ERROR, status: 403 };
  }

  const identity = verifyIngestToken({
    secret,
    prefix: AGENT_FEEDBACK_TOKEN_PREFIX,
    token,
  });
  if (!identity) {
    return { success: false, error: FEEDBACK_TOKEN_INVALID_ERROR, status: 401 };
  }

  try {
    const generation = await getTokenGeneration(c, identity.organizationId);
    if (generation === null || generation !== identity.generation) {
      return {
        success: false,
        error: FEEDBACK_TOKEN_REVOKED_ERROR,
        status: 401,
      };
    }

    const projectActive = await projectBelongsToOrganization(c, identity);
    if (!projectActive) {
      return {
        success: false,
        error: FEEDBACK_TOKEN_INVALID_ERROR,
        status: 401,
      };
    }
  } catch {
    return {
      success: false,
      error: FEEDBACK_TOKEN_UNAVAILABLE_ERROR,
      status: 503,
    };
  }

  return { success: true, identity };
}
