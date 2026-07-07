import { db } from "@notra/db/drizzle";
import { organizations, skills } from "@notra/db/schema";
import { count, eq } from "drizzle-orm";
import { seedSystemSkills } from "../src/lib/skills/seed";

async function main() {
  const orgs = await db.select({ id: organizations.id }).from(organizations);
  const [before] = await db
    .select({ value: count() })
    .from(skills)
    .where(eq(skills.isSystem, true));

  let seeded = 0;
  let skipped = 0;
  let failed = 0;

  for (const org of orgs) {
    try {
      const insertedCount = await seedSystemSkills(org.id);
      if (insertedCount > 0) {
        seeded += 1;
        console.log(`[${org.id}] seeded ${insertedCount} system skills`);
      } else {
        skipped += 1;
      }
    } catch (error) {
      failed += 1;
      console.error(`[${org.id}] failed to seed system skills:`, error);
    }
  }

  console.log(
    `Organizations: ${seeded} seeded, ${skipped} already seeded, ${failed} failed`
  );

  if (failed > 0) {
    throw new Error(`Failed to seed ${failed} organizations`);
  }

  const [after] = await db
    .select({ value: count() })
    .from(skills)
    .where(eq(skills.isSystem, true));

  console.log(
    `Backfilled ${orgs.length} organizations: system skills ${before?.value ?? 0} -> ${after?.value ?? 0}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
