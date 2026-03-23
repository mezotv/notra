import { OpenAPIHono } from "@hono/zod-openapi";
import { createDb } from "@notra/db/drizzle-http";
import { trimTrailingSlash } from "hono/trailing-slash";
import { authMiddleware } from "./middleware/auth";
import { contentRoutes } from "./routes/content";

const FRAMER_PLUGIN_ID = "8d4wmwtko6960jsu3ojmalvqm";

const FRAMER_PLUGIN_ORIGIN_PATTERN = new RegExp(
  `^https://${FRAMER_PLUGIN_ID}(-[a-zA-Z0-9]+)?\\.plugins\\.framercdn\\.com$`
);

const LOCAL_DEV_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function getAllowedOrigin(origin: string | undefined): string | null {
  if (!origin) {
    return null;
  }

  if (
    FRAMER_PLUGIN_ORIGIN_PATTERN.test(origin) ||
    LOCAL_DEV_ORIGIN_PATTERN.test(origin)
  ) {
    return origin;
  }

  return null;
}

interface Bindings {
  UNKEY_ROOT_KEY: string;
  DATABASE_URL: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  QSTASH_TOKEN?: string;
  CONTENT_GENERATION_WORKFLOW_URL?: string;
  CONTENT_GENERATION_WORKFLOW_BASE_URL?: string;
  BRAND_ANALYSIS_WORKFLOW_URL?: string;
  BRAND_ANALYSIS_WORKFLOW_BASE_URL?: string;
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

const app = new OpenAPIHono<AppEnv>({ strict: true });

app.use("/v1/*", async (c, next) => {
  const origin = c.req.header("origin");
  const allowedOrigin = getAllowedOrigin(origin);

  c.header("Vary", "Origin");
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
    return c.body(null, 204);
  }

  await next();
});

app.use(trimTrailingSlash({ alwaysRedirect: true }));

app.use("/v1/*", async (c, next) => {
  c.set("db", createDb(c.env.DATABASE_URL));
  await next();
});

app.use("/v1/*", (c, next) => {
  const permissions = ["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method)
    ? "api.write"
    : "api.read";
  return authMiddleware({ permissions })(c, next);
});

app.get("/", (c) => {
  return c.text("ok");
});

app.get("/ping", (c) => {
  return c.text("pong");
});

app.route("/v1", contentRoutes);

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
    description: "OpenAPI schema for authenticated content endpoints.",
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
  ],
}));

export default {
  port: process.env.PORT ?? 3000,
  fetch: (request: Request) => app.fetch(request, process.env),
};
