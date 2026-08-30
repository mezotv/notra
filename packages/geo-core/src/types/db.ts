import type { db } from "@notra/db/drizzle";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
