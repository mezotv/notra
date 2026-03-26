import { upstashCache } from "drizzle-orm/cache/upstash";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
// biome-ignore lint/performance/noNamespaceImport: Required for drizzle-kit
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("[ENV]: DATABASE_URL is not defined");
}
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const db: NodePgDatabase<typeof schema> = drizzle(databaseUrl, {
  cache:
    upstashUrl && upstashToken
      ? upstashCache({
          url: upstashUrl,
          token: upstashToken,
          global: true,
        })
      : undefined,
  schema,
});
