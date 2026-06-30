import "./tcc";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createDb } from "@notra/db/drizzle";
import { trimTrailingSlash } from "hono/trailing-slash";
import {
  LEGACY_API_READ_SCOPE,
  LEGACY_API_WRITE_SCOPE,
} from "./constants/oauth-scopes";
import { authMiddleware } from "./middleware/auth";
import { subscriptionMiddleware } from "./middleware/subscription";
import { brandIdentitiesRoutes } from "./routes/brand-identities";
import { chatWorkflowRoutes } from "./routes/chat-workflow";
import { chatsRoutes } from "./routes/chats";
import { integrationsRoutes } from "./routes/integrations";
import { legacyRedirectRoutes } from "./routes/legacy-redirects";
import { postsRoutes } from "./routes/posts";
import { schedulesRoutes } from "./routes/schedules";
import { skillsRoutes } from "./routes/skills";
import {
  API_URL,
  AUTH_GUIDE_URL,
  buildAuthorizationServerMetadata,
  buildProtectedResourceMetadata,
  RESOURCE_METADATA_URL,
  SITE_URL,
} from "./utils/agent-discovery";
import { assertRequiredEnv } from "./utils/env";
import { getRequiredOAuthScope } from "./utils/oauth-scopes";

const FRAMER_PLUGIN_ID = "8d4wmwtko6960jsu3ojmalvqm";

const FRAMER_PLUGIN_ORIGIN_PATTERN = new RegExp(
  `^https://${FRAMER_PLUGIN_ID}(-[a-zA-Z0-9]+)?\\.plugins\\.framercdn\\.com$`
);

const LOCAL_DEV_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const publicStatusResponseSchema = z
  .object({
    status: z.literal("ok"),
    service: z.literal("Notra API"),
    version: z.string(),
    public: z.literal(true),
    authentication: z.object({
      type: z.literal("bearer"),
      resource_metadata: z.string().url(),
      guide: z.string().url(),
    }),
  })
  .openapi("PublicStatusResponse");

const publicStatusRoute = createRoute({
  method: "get",
  path: "/v1/status",
  tags: ["Discovery"],
  operationId: "getPublicApiStatus",
  summary: "Check public API reachability",
  security: [],
  responses: {
    200: {
      description:
        "Public reachability and authentication discovery metadata for agents.",
      content: {
        "application/json": {
          schema: publicStatusResponseSchema,
        },
      },
    },
  },
});

function getAllowedOrigin(origin: string | undefined): string | null {
  if (!origin) {
    return null;
  }

  const allowedPatterns = [
    FRAMER_PLUGIN_ORIGIN_PATTERN,
    ...(IS_PRODUCTION ? [] : [LOCAL_DEV_ORIGIN_PATTERN]),
  ];

  return allowedPatterns.some((pattern) => pattern.test(origin))
    ? origin
    : null;
}

interface Bindings {
  UNKEY_ROOT_KEY: string;
  DATABASE_URL: string;
  AUTUMN_SECRET_KEY?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  QSTASH_TOKEN?: string;
  WORKFLOW_BASE_URL?: string;
  INTEGRATION_ENCRYPTION_KEY?: string;
  NEXT_PUBLIC_APP_URL?: string;
  APP_URL?: string;
  BETTER_AUTH_URL?: string;
}

interface AppEnv {
  Bindings: Bindings;
  Variables: {
    db: ReturnType<typeof createDb>;
  };
}

assertRequiredEnv();

const app = new OpenAPIHono<AppEnv>({ strict: true });

app.use("/v1/*", async (c, next) => {
  const origin = c.req.header("origin");
  const allowedOrigin = getAllowedOrigin(origin);

  c.header("Vary", "Origin, Authorization");
  c.header("Cache-Control", "private, no-store");
  c.header("X-Content-Type-Options", "nosniff");
  c.header(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");

  if (allowedOrigin) {
    c.header("Access-Control-Allow-Origin", allowedOrigin);
    c.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (c.req.method === "OPTIONS") {
    return c.body(null, allowedOrigin ? 204 : 403);
  }

  await next();
});

app.use(trimTrailingSlash({ alwaysRedirect: true }));

app.use("/v1/*", async (c, next) => {
  c.set("db", createDb(c.env.DATABASE_URL));
  await next();
});

app.openapi(publicStatusRoute, (c) => {
  return c.json({
    status: "ok",
    service: "Notra API",
    version: "1.0.0",
    public: true,
    authentication: {
      type: "bearer",
      resource_metadata: RESOURCE_METADATA_URL,
      guide: AUTH_GUIDE_URL,
    },
  });
});

app.use("/v1/*", (c, next) => {
  const requiredScope = getRequiredOAuthScope(
    new URL(c.req.url).pathname,
    c.req.method
  );
  const legacyPermission = ["POST", "PUT", "PATCH", "DELETE"].includes(
    c.req.method
  )
    ? LEGACY_API_WRITE_SCOPE
    : LEGACY_API_READ_SCOPE;

  return authMiddleware({
    legacyPermissions: [legacyPermission],
    permissions: requiredScope,
  })(c, next);
});

app.use("/v1/*", subscriptionMiddleware());

app.get("/", (c) => {
  return c.text("ok");
});

app.get("/ping", (c) => {
  return c.text("pong");
});

app.get("/.well-known/oauth-protected-resource", (c) => {
  return c.json(buildProtectedResourceMetadata(new URL(c.req.url).origin));
});

app.get("/.well-known/oauth-authorization-server", (c) => {
  return c.json(buildAuthorizationServerMetadata());
});

app.get("/.well-known/api-catalog", (c) => {
  c.header(
    "Content-Type",
    'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"; charset=utf-8'
  );

  return c.body(
    JSON.stringify({
      linkset: [
        {
          anchor: API_URL,
          item: [
            {
              href: `${API_URL}/openapi.json`,
              rel: "service-desc",
              type: "application/openapi+json",
              title: "Notra Public API OpenAPI schema",
            },
            {
              href: AUTH_GUIDE_URL,
              rel: "authorization-server-metadata",
              type: "text/markdown",
              title: "Notra agent authentication guide",
            },
          ],
        },
      ],
    })
  );
});

app.route("/v1", legacyRedirectRoutes);
app.route("/v1", postsRoutes);
app.route("/v1", brandIdentitiesRoutes);
app.route("/v1", integrationsRoutes);
app.route("/v1", schedulesRoutes);
app.route("/v1", chatsRoutes);
app.route("/v1", skillsRoutes);
app.route("/", chatWorkflowRoutes);

app.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "API Key",
  description:
    "Send your API key in the Authorization header as Bearer API_KEY.",
});

app.doc31("/openapi.json", (_c) => ({
  openapi: "3.1.1",
  info: {
    title: "Notra API",
    version: "1.0.0",
    description:
      "OpenAPI schema for Notra content endpoints. Use GET /v1/status for public reachability. Error responses include recovery guidance.",
  },
  servers: [
    {
      url: "https://api.usenotra.com",
      description: "Production",
    },
  ],
  security: [{ BearerAuth: [] }],
  tags: [
    {
      name: "Content",
      description:
        "Read content. Organization is inferred from the API key (identity.externalId).",
    },
    {
      name: "Schedules",
      description:
        "Manage scheduled content generation. Organization is inferred from the API key (identity.externalId).",
    },
    {
      name: "Chats",
      description:
        "Manage chat sessions. Organization is inferred from the API key (identity.externalId).",
    },
    {
      name: "Skills",
      description:
        "Manage reusable writing skills. Organization is inferred from the API key (identity.externalId).",
    },
  ],
}));

export default {
  port: process.env.PORT ?? 3000,
  fetch: (request: Request) => app.fetch(request, process.env),
};
