import { OpenAPIHono } from "@hono/zod-openapi";
import { createDb } from "@notra/db/drizzle-http";
import { trimTrailingSlash } from "hono/trailing-slash";
import { authMiddleware } from "./middleware/auth";
import { contentRoutes } from "./routes/content";

interface Bindings {
  UNKEY_ROOT_KEY: string;
  DATABASE_URL: string;
}

interface AppEnv {
  Bindings: Bindings;
  Variables: {
    db: ReturnType<typeof createDb>;
  };
}

const app = new OpenAPIHono<AppEnv>({ strict: true });

app.use(trimTrailingSlash({ alwaysRedirect: true }));

app.use("/v1/*", async (c, next) => {
  c.set("db", createDb(c.env.DATABASE_URL));
  await next();
});

app.use("/v1/*", (c, next) =>
  authMiddleware({ permissions: "api.read" })(c, next)
);

app.get("/", (c) => {
  return c.text("ok");
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
      description: "Read content for the authenticated organization",
    },
  ],
}));

export default app;
