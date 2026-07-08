import { generateCollectionTitle } from "@notra/ai/jobs/collection-title";
import { db } from "@notra/db/drizzle";
import { postCollections } from "@notra/db/schema";
import { isLegacyPostCollectionName } from "@notra/db/utils/post-collections";
import { and, desc, eq } from "drizzle-orm";

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

async function main() {
  const dryRun = hasFlag("dry-run");
  const organizationId = getArgValue("org");
  const limitValue = getArgValue("limit");
  const limit = limitValue ? Number.parseInt(limitValue, 10) : undefined;

  if (limitValue && (!limit || limit <= 0)) {
    throw new Error(`Invalid --limit value: ${limitValue}`);
  }

  const filters = [eq(postCollections.nameSource, "generated")];
  if (organizationId) {
    filters.push(eq(postCollections.organizationId, organizationId));
  }

  const candidates = await db
    .select({
      id: postCollections.id,
      organizationId: postCollections.organizationId,
      name: postCollections.name,
    })
    .from(postCollections)
    .where(and(...filters))
    .orderBy(desc(postCollections.createdAt));

  const legacyCollections = candidates.filter((collection) =>
    isLegacyPostCollectionName(collection.name)
  );
  const targets = limit ? legacyCollections.slice(0, limit) : legacyCollections;

  console.log(
    `Found ${candidates.length} generated-name collections, ${legacyCollections.length} with legacy titles, processing ${targets.length}${dryRun ? " (dry run)" : ""}`
  );

  let renamed = 0;
  let skipped = 0;
  let failed = 0;

  for (const collection of targets) {
    try {
      const title = await generateCollectionTitle({
        collectionId: collection.id,
        organizationId: collection.organizationId,
        nameSource: "backfill",
        dryRun,
      });

      if (title) {
        renamed += 1;
        console.log(`[${collection.id}] "${collection.name}" -> "${title}"`);
      } else {
        skipped += 1;
        console.log(`[${collection.id}] skipped (no posts or empty title)`);
      }
    } catch (error) {
      failed += 1;
      console.error(`[${collection.id}] failed to generate title:`, error);
    }
  }

  console.log(
    `Done: ${renamed} renamed, ${skipped} skipped, ${failed} failed${dryRun ? " (dry run, nothing saved)" : ""}`
  );

  if (failed > 0) {
    throw new Error(`Failed to backfill ${failed} collections`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
