import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { serve } from "@hono/node-server";
import app from "./index";

for (const file of [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env.local"),
  resolve(process.cwd(), "../../.env"),
]) {
  if (existsSync(file)) {
    loadEnvFile(file);
  }
}

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port });
