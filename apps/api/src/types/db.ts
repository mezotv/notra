import type { createDb } from "@notra/db/drizzle";

export type DbClient = ReturnType<typeof createDb>;
