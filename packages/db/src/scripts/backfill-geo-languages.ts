import { sql } from "drizzle-orm";
import { db } from "../drizzle";

const DEFAULT_LANGUAGE = "English";

async function backfillGeoLanguages() {
  const result = await db.execute(sql`
    update geo_settings
    set languages = array_prepend(${DEFAULT_LANGUAGE}::text, languages)
    where languages is not null
      and not (${DEFAULT_LANGUAGE} = any(languages))
  `);
  console.log(
    `[geo] added ${DEFAULT_LANGUAGE} to ${result.rowCount ?? 0} project language lists`
  );
}

backfillGeoLanguages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
