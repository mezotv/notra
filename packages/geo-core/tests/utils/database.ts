import { PGlite } from "@electric-sql/pglite";
import {
  brandSettings,
  geoMentionChecks,
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
  geoMentionChecks,
  organizations,
  brandSettings,
  projects,
  geoSettings,
  geoScans,
};
export function createTestDatabase() {
  const postgres = new PGlite();
  const testDb = drizzle(postgres, { schema });

  async function initializeDatabase() {
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

  async function resetDatabase() {
    await postgres.exec('TRUNCATE "organizations" CASCADE');
  }

  async function seedProject(
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

  function settingsFor(projectId: string) {
    return testDb.query.geoSettings.findFirst({
      where: (table, { eq }) => eq(table.projectId, projectId),
    });
  }
  return {
    postgres,
    testDb,
    initializeDatabase,
    resetDatabase,
    seedProject,
    settingsFor,
  };
}

export const {
  postgres,
  testDb,
  initializeDatabase,
  resetDatabase,
  seedProject,
  settingsFor,
} = createTestDatabase();
