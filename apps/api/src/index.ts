import { createDb } from "@notra/db/drizzle-http";
import { Hono } from "hono";
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

const app = new Hono<AppEnv>({ strict: true });

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

export default app;
