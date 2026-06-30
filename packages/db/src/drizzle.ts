import { upstashCache } from "drizzle-orm/cache/upstash";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
// biome-ignore lint/performance/noNamespaceImport: Required for drizzle-kit
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const dbByUrl = new Map<string, NodePgDatabase<typeof schema>>();

export function createDb(databaseUrl: string): NodePgDatabase<typeof schema> {
  const cached = dbByUrl.get(databaseUrl);
  if (cached) {
    return cached;
  }

  const client = drizzle(databaseUrl, {
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
  dbByUrl.set(databaseUrl, client);
  return client;
}

function createMissingDatabaseUrlProxy(): NodePgDatabase<typeof schema> {
  return new Proxy({} as NodePgDatabase<typeof schema>, {
    get() {
      throw new Error("[ENV]: DATABASE_URL is not defined");
    },
  });
}

export const db = databaseUrl
  ? createDb(databaseUrl)
  : createMissingDatabaseUrlProxy();
