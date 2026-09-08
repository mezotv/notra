import { PGlite } from "@electric-sql/pglite";
import {
  brandSettings,
  geoScans,
  geoSettings,
  organizations,
  projects,
} from "@notra/db/schema";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";

import type { ScanSettingsInput } from "../types/fixtures";

// Generate DDL from production tables so column/constraint changes reach tests.
const schema = {
  organizations,
  brandSettings,
  projects,
  geoSettings,
  geoScans,
};
export const postgres = new PGlite();
export const testDb = drizzle(postgres, { schema });

export async function initializeDatabase() {
  const statements = await generateMigration(
    generateDrizzleJson({}),
    generateDrizzleJson(schema)
  );
  // drizzle-kit can emit composite FKs before the unique indexes they reference.
  for (const statement of statements.filter(
    (sql) => !sql.startsWith("ALTER TABLE")
  )) {
    await postgres.exec(statement);
  }
  for (const statement of statements.filter((sql) =>
    sql.startsWith("ALTER TABLE")
  )) {
    await postgres.exec(statement);
  }
}

export async function resetDatabase() {
  await postgres.exec('TRUNCATE "organizations" CASCADE');
}

export async function seedProject(
  projectId: string,
  overrides: ScanSettingsInput = {}
) {
  const organizationId = overrides.organizationId ?? "org-test";
  await testDb
    .insert(organizations)
    .values({
      id: organizationId,
      name: organizationId,
      slug: organizationId,
      createdAt: new Date(),
    })
    .onConflictDoNothing();
  await testDb.insert(brandSettings).values({
    id: `brand-${projectId}`,
    organizationId,
    name: projectId,
    isDefault: false,
    websiteUrl: "https://example.com",
  });
  await testDb.insert(projects).values({
    id: projectId,
    organizationId,
    name: projectId,
    brandSettingsId: `brand-${projectId}`,
  });
  await testDb.insert(geoSettings).values({
    id: `settings-${projectId}`,
    organizationId,
    projectId,
    companyName: projectId,
    ...overrides,
  });
  return { organizationId, projectId };
}

export function settingsFor(projectId: string) {
  return testDb.query.geoSettings.findFirst({
    where: (table, { eq }) => eq(table.projectId, projectId),
  });
}
