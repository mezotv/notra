import { db } from "@notra/db/drizzle";
import { geoSettings, projects } from "@notra/db/schema";
import { and, asc, eq } from "drizzle-orm";

import type { GeoOnboardingStage } from "../types/geo";

export async function getGeoOnboardingStage(
  organizationId: string,
  projectId?: string
): Promise<GeoOnboardingStage> {
  const scoped = projectId
    ? await db.query.projects.findFirst({
        columns: { id: true },
        where: and(
          eq(projects.id, projectId),
          eq(projects.organizationId, organizationId)
        ),
      })
    : await db.query.projects.findFirst({
        columns: { id: true },
        where: eq(projects.organizationId, organizationId),
        orderBy: [asc(projects.createdAt)],
      });

  if (!scoped) {
    return "brand";
  }

  const settings = await db.query.geoSettings.findFirst({
    columns: { scanStartedAt: true, lastScanAt: true },
    where: eq(geoSettings.projectId, scoped.id),
  });
  if (!settings) {
    return "brand";
  }

  if (settings.scanStartedAt || settings.lastScanAt) {
    return "complete";
  }

  return "competitors";
}
