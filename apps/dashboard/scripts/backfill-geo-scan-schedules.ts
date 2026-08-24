import { db } from "@notra/db/drizzle";
import { geoSettings } from "@notra/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { syncGeoScanSchedule } from "@/lib/geo/schedule";

const settingsRows = await db.query.geoSettings.findMany({
  where: and(
    eq(geoSettings.enabled, true),
    isNull(geoSettings.qstashMessageId)
  ),
});

let queued = 0;
for (const settings of settingsRows) {
  const qstashMessageId = await syncGeoScanSchedule({
    organizationId: settings.organizationId,
    projectId: settings.projectId,
    enabled: true,
    scanIntervalHours: settings.scanIntervalHours,
    existingMessageId: null,
  });
  if (!qstashMessageId) {
    continue;
  }
  await db
    .update(geoSettings)
    .set({ qstashMessageId })
    .where(eq(geoSettings.id, settings.id));
  queued += 1;
}

console.log(`Queued ${queued} of ${settingsRows.length} GEO scan schedules.`);
