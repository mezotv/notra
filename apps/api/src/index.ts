import { type UnkeyContext, unkey } from "@unkey/hono";
import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { contentRoutes } from "./routes/content";

const app = new Hono<{ Variables: { unkey: UnkeyContext } }>({ strict: true });

if (!process.env.UNKEY_ROOT_KEY) {
  throw new Error("UNKEY_ROOT_KEY is not set");
}

app.use(trimTrailingSlash({ alwaysRedirect: true }));
app.use(
  "/v1/*",
  unkey({
    rootKey: process.env.UNKEY_ROOT_KEY,
  })
);

app.get("/", (c) => {
  return c.text("ok");
});

app.route("/v1", contentRoutes);

export default {
  port: 3004,
  fetch: app.fetch,
};
