import { PGlite } from "@electric-sql/pglite";
import { geoMentionChecks } from "@notra/db/schema";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";

export const promptPostgres = new PGlite();
export const promptTestDb = drizzle(promptPostgres, {
  schema: { geoMentionChecks },
});

export async function initializePromptDatabase() {
  const statements = await generateMigration(
    generateDrizzleJson({}),
    generateDrizzleJson({ geoMentionChecks })
  );
  // This isolated fixture tests reads, without requiring unrelated parent rows.
  // Column definitions and indexes come from the production table.
  for (const statement of statements.filter(
    (sql) => !sql.startsWith("ALTER TABLE")
  )) {
    await promptPostgres.exec(statement);
  }
}

export function promptCheckFixture(
  id: string,
  organizationId = "org-a",
  projectId = "project-a",
  capturedAt = new Date("2026-08-15T12:00:00Z")
) {
  return {
    id,
    organizationId,
    projectId,
    scanId: `scan-${id}`,
    engine: "engine-a",
    promptId: "prompt-a",
    prompt: "Which tool?",
    answer: "Full answer ".repeat(1000),
    mentioned: true,
    position: 1,
    sentiment: "positive",
    competitors: ["Competitor"],
    excerpt: "An excerpt",
    grounding: {
      queries: ["search terms"],
      sources: [
        { title: "Source", url: "https://example.com", domain: "example.com" },
      ],
    },
    sources: [{ title: "Source", url: "https://example.com" }],
    language: "English",
    finishReason: "stop",
    promptTokens: 100,
    outputTokens: 200,
    reasoningTokens: 50,
    capturedAt,
  };
}
