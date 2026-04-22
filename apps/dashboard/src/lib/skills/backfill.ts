import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { seedSystemSkills } from "./seed";

export async function backfillSystemSkills(): Promise<{
  total: number;
  seeded: number;
  failed: Array<{ organizationId: string; error: string }>;
}> {
  const orgs = await db.select({ id: organizations.id }).from(organizations);

  let seeded = 0;
  const failed: Array<{ organizationId: string; error: string }> = [];

  for (const org of orgs) {
    try {
      await seedSystemSkills(org.id);
      seeded += 1;
    } catch (error) {
      failed.push({
        organizationId: org.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    total: orgs.length,
    seeded,
    failed,
  };
}

async function main(): Promise<void> {
  console.log("[skills backfill] starting...");
  const result = await backfillSystemSkills();
  console.log("[skills backfill] done", result);
  if (result.failed.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

const isDirect =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("backfill.ts") ||
    process.argv[1].endsWith("backfill.js"));

if (isDirect) {
  main().catch((error) => {
    console.error("[skills backfill] fatal", error);
    process.exit(1);
  });
}
