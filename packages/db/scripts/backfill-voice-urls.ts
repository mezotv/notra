import { sql } from "drizzle-orm";
import { db } from "../src/drizzle";

async function hasColumn(table: string, column: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS present
  `);

  return Boolean(result.rows[0]?.present);
}

async function backfill() {
  console.log("[backfill] Starting voice URL backfill...");

  console.log("[backfill] Preflight: checking required columns");
  const orgHasWebsiteUrl = await hasColumn("organizations", "website_url");
  const brandHasWebsiteUrl = await hasColumn("brand_settings", "website_url");
  const brandHasIsDefault = await hasColumn("brand_settings", "is_default");

  console.log(
    `[backfill] Columns: organizations.website_url=${orgHasWebsiteUrl}, brand_settings.website_url=${brandHasWebsiteUrl}, brand_settings.is_default=${brandHasIsDefault}`
  );

  if (!brandHasWebsiteUrl) {
    console.error(
      "[backfill] FATAL: brand_settings.website_url does not exist yet. Run the schema migration that adds it first."
    );
    process.exit(1);
  }

  if (!orgHasWebsiteUrl) {
    console.log(
      "[backfill] organizations.website_url is already dropped; nothing to backfill from organizations."
    );

    const stats = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(website_url) as with_url,
        COUNT(*) - COUNT(website_url) as without_url,
        COUNT(*) FILTER (WHERE website_url = '') as empty_url
      FROM brand_settings
    `);

    const row = stats.rows[0];
    console.log(`[backfill] Total voices: ${row?.total}`);
    console.log(`[backfill] With URL (non-null): ${row?.with_url}`);
    console.log(`[backfill] Without URL (null): ${row?.without_url}`);
    console.log(`[backfill] Empty URL string: ${row?.empty_url}`);
    console.log("[backfill] Done (no-op).");
    process.exit(0);
  }

  if (!brandHasIsDefault) {
    console.error(
      "[backfill] FATAL: brand_settings.is_default does not exist yet. Run the schema migration that adds it first."
    );
    process.exit(1);
  }

  console.log(
    "[backfill] Step 1: Copying organization websiteUrl to default brand voices"
  );

  const copyResult = await db.execute(sql`
    UPDATE brand_settings
    SET website_url = organizations.website_url
    FROM organizations
    WHERE brand_settings.organization_id = organizations.id
      AND brand_settings.is_default = true
      AND brand_settings.website_url IS NULL
      AND organizations.website_url IS NOT NULL
  `);

  console.log(
    `[backfill] Updated ${copyResult.rowCount ?? 0} default voices with org URL`
  );

  console.log(
    "[backfill] Step 2: Copying organization websiteUrl to non-default voices without a URL"
  );

  const copyNonDefault = await db.execute(sql`
    UPDATE brand_settings
    SET website_url = organizations.website_url
    FROM organizations
    WHERE brand_settings.organization_id = organizations.id
      AND brand_settings.is_default = false
      AND brand_settings.website_url IS NULL
      AND organizations.website_url IS NOT NULL
  `);

  console.log(
    `[backfill] Updated ${copyNonDefault.rowCount ?? 0} non-default voices with org URL`
  );

  console.log(
    "[backfill] Step 3: Verifying no voices have null websiteUrl where org had a URL"
  );

  const remaining = await db.execute(sql`
    SELECT bs.id, bs.name, bs.organization_id, o.website_url as org_url
    FROM brand_settings bs
    JOIN organizations o ON o.id = bs.organization_id
    WHERE bs.website_url IS NULL
      AND o.website_url IS NOT NULL
  `);

  if (remaining.rows.length > 0) {
    console.warn(
      `[backfill] WARNING: ${remaining.rows.length} voices still missing URL:`
    );
    for (const row of remaining.rows) {
      console.warn(
        `  - voice ${row.id} (${row.name}) org=${row.organization_id}`
      );
    }
  } else {
    console.log("[backfill] All voices with org URLs have been backfilled");
  }

  console.log("[backfill] Step 4: Summary");

  const stats = await db.execute(sql`
    SELECT
      COUNT(*) as total,
      COUNT(website_url) as with_url,
      COUNT(*) - COUNT(website_url) as without_url,
      COUNT(*) FILTER (WHERE website_url = '') as empty_url
    FROM brand_settings
  `);

  const row = stats.rows[0];
  console.log(`[backfill] Total voices: ${row?.total}`);
  console.log(`[backfill] With URL (non-null): ${row?.with_url}`);
  console.log(`[backfill] Without URL (null): ${row?.without_url}`);
  console.log(`[backfill] Empty URL string: ${row?.empty_url}`);

  console.log("[backfill] Done.");
  process.exit(0);
}

backfill().catch((error) => {
  console.error("[backfill] FATAL:", error);
  process.exit(1);
});
