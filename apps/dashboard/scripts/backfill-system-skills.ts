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

  for (const org of orgs) {
    await seedSystemSkills(org.id);
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
