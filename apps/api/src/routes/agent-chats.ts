import { createRoute } from "@hono/zod-openapi";
import { AGENT_SESSION_ROUTE_PATH } from "@notra/ai/constants/agent";
import {
  createAgentChatSession,
  createAgentClient,
  getAgentSessionForOrganization,
  isAgentApiEnabled,
  listAgentSessionsForOrganization,
} from "../lib/agent/client";
import {
  agentSessionParamsSchema,
  createAgentChatRequestSchema,
  createAgentChatResponseSchema,
  listAgentChatsQuerySchema,
  listAgentChatsResponseSchema,
  sendAgentMessageRequestSchema,
} from "../schemas/agent-chats";
import { getOrganizationId } from "../utils/auth";
import { createOpenApiApp } from "../utils/openapi-app";
import { errorResponse, rateLimitResponse } from "../utils/openapi-responses";
import { enforceRatelimit, RATE_LIMITS, ratelimit } from "../utils/ratelimit";

export const agentChatsRoutes = createOpenApiApp();

const eventStreamResponses = {
  200: {
    description:
      "Durable, replayable eve session event stream (newline-delimited JSON). Pass startIndex to resume from a known position.",
    content: {
      "application/x-ndjson": { schema: { type: "string" as const } },
    },
  },
  401: errorResponse("Missing or invalid API key"),
  403: errorResponse("Forbidden"),
  404: errorResponse("Session not found"),
  503: errorResponse("Agent service is not configured"),
};

const createAgentChatRoute = createRoute({
  method: "post",
  path: "/agent-chats",
  tags: ["Agent"],
  operationId: "createAgentChat",
  summary: "Start a durable agent session",
  description:
    "Starts a new durable session with the Notra agent and returns its session id and continuation token. Stream events from GET /v2/agent-chats/{sessionId}/events.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: createAgentChatRequestSchema },
      },
    },
  },
  responses: {
    201: {
      description: "Session created",
      content: {
        "application/json": { schema: createAgentChatResponseSchema },
      },
    },
    400: errorResponse("Invalid request body"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    429: rateLimitResponse(
      RATE_LIMITS.chatGeneration.requests,
      RATE_LIMITS.chatGeneration.window
    ),
    502: errorResponse("Agent session creation failed"),
    503: errorResponse("Agent service is not configured"),
  },
});

const sendAgentMessageRoute = createRoute({
  method: "post",
  path: "/agent-chats/{sessionId}/messages",
  tags: ["Agent"],
  operationId: "sendAgentMessage",
  summary: "Send a follow-up message to an agent session",
  request: {
    params: agentSessionParamsSchema,
    body: {
      required: true,
      content: {
        "application/json": { schema: sendAgentMessageRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description:
        "Upstream eve response with the next continuation token for this session.",
      content: { "application/json": { schema: { type: "object" as const } } },
    },
    400: errorResponse("Invalid request body"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse("Session not found"),
    429: rateLimitResponse(
      RATE_LIMITS.chatGeneration.requests,
      RATE_LIMITS.chatGeneration.window
    ),
    503: errorResponse("Agent service is not configured"),
  },
});

const listAgentChatsRoute = createRoute({
  method: "get",
  path: "/agent-chats",
  tags: ["Agent"],
  operationId: "listAgentChats",
  summary: "List agent sessions",
  request: { query: listAgentChatsQuerySchema },
  responses: {
    200: {
      description: "Agent sessions fetched successfully",
      content: {
        "application/json": { schema: listAgentChatsResponseSchema },
      },
    },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    503: errorResponse("Agent service is not configured"),
  },
});

agentChatsRoutes.openapi(createAgentChatRoute, async (c) => {
  if (!isAgentApiEnabled()) {
    return c.json({ error: "Agent service is not configured" }, 503);
  }
  const organizationId = getOrganizationId(c);
  if (!organizationId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }
  const rateLimited = await enforceRatelimit(
    c,
    ratelimit.chatGeneration,
    "organization"
  );
  if (rateLimited) {
    return rateLimited;
  }

  const { message } = c.req.valid("json");
  try {
    const payload = await createAgentChatSession({ organizationId }, message);
    return c.json(
      {
        sessionId: payload.sessionId,
        continuationToken: payload.continuationToken,
      },
      201
    );
  } catch (error) {
    console.error("[agent-chats] Session creation failed", error);
    return c.json({ error: "Agent session creation failed" }, 502);
  }
});

agentChatsRoutes.openAPIRegistry.registerPath(sendAgentMessageRoute);

agentChatsRoutes.post("/agent-chats/:sessionId/messages", async (c) => {
  if (!isAgentApiEnabled()) {
    return c.json({ error: "Agent service is not configured" }, 503);
  }
  const organizationId = getOrganizationId(c);
  if (!organizationId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }
  const rateLimited = await enforceRatelimit(
    c,
    ratelimit.chatGeneration,
    "organization"
  );
  if (rateLimited) {
    return rateLimited;
  }

  const sessionId = c.req.param("sessionId");
  const mapping = await getAgentSessionForOrganization(
    organizationId,
    sessionId
  );
  if (!mapping) {
    return c.json({ error: "Session not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = sendAgentMessageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const { message, continuationToken } = parsed.data;
  const client = await createAgentClient({
    organizationId,
    userId: mapping.userId ?? undefined,
    chatId: mapping.chatId ?? undefined,
  });
  const upstream = await client.fetch(
    `${AGENT_SESSION_ROUTE_PATH}/${sessionId}`,
    {
      body: JSON.stringify({ continuationToken, message }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }
  );
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
});

agentChatsRoutes.get("/agent-chats/:sessionId/events", async (c) => {
  if (!isAgentApiEnabled()) {
    return c.json({ error: "Agent service is not configured" }, 503);
  }
  const organizationId = getOrganizationId(c);
  if (!organizationId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }
  const sessionId = c.req.param("sessionId");
  const mapping = await getAgentSessionForOrganization(
    organizationId,
    sessionId
  );
  if (!mapping) {
    return c.json({ error: "Session not found" }, 404);
  }

  const client = await createAgentClient({ organizationId });
  const startIndex = c.req.query("startIndex");
  const upstream = await client.fetch(
    `${AGENT_SESSION_ROUTE_PATH}/${sessionId}/stream${startIndex ? `?startIndex=${encodeURIComponent(startIndex)}` : ""}`,
    { method: "GET" }
  );
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ??
        "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
});

agentChatsRoutes.openAPIRegistry.registerPath({
  method: "get",
  path: "/agent-chats/{sessionId}/events",
  tags: ["Agent"],
  operationId: "streamAgentChatEvents",
  summary: "Stream an agent session's events",
  request: { params: agentSessionParamsSchema },
  responses: eventStreamResponses,
});

agentChatsRoutes.openapi(listAgentChatsRoute, async (c) => {
  if (!isAgentApiEnabled()) {
    return c.json({ error: "Agent service is not configured" }, 503);
  }
  const organizationId = getOrganizationId(c);
  if (!organizationId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }
  const { limit } = c.req.valid("query");
  const sessions = await listAgentSessionsForOrganization(
    organizationId,
    limit
  );
  return c.json(
    {
      sessions: sessions.map((session) => ({
        sessionId: session.eveSessionId,
        chatId: session.chatId,
        surface: session.surface,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      })),
    },
    200
  );
});
