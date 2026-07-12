import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { EVE_AGENT_ORGANIZATION_HEADER } from "@notra/ai/constants/onboarding-agent";
import { db } from "@notra/db/drizzle";
import {
  brandReferences,
  brandSettings,
  organizations,
  skills,
} from "@notra/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { Client } from "eve/client";
import {
  ONBOARDING_EVALUATION_COMPANIES,
  ONBOARDING_EVALUATION_SKILL_SOURCE_ORGANIZATION_ID,
} from "../agent/lib/constants/onboarding-evaluation";
import type {
  EvaluationCompanySnapshot,
  OnboardingEvaluationState,
} from "../agent/lib/types/onboarding-evaluation";
import { getEveServiceAuth } from "../agent/lib/utils/eve-client-auth";

async function ensureMintlifyEvaluationOrganization(): Promise<void> {
  const company = ONBOARDING_EVALUATION_COMPANIES[0];
  await db
    .insert(organizations)
    .values({
      createdAt: new Date(),
      id: company.organizationId,
      name: company.organizationName,
      slug: company.organizationSlug,
    })
    .onConflictDoNothing();

  const existingSettings = await db.query.brandSettings.findFirst({
    columns: { id: true },
    where: eq(brandSettings.organizationId, company.organizationId),
  });
  if (!existingSettings) {
    await db.insert(brandSettings).values({
      id: randomUUID(),
      organizationId: company.organizationId,
      websiteUrl: `https://${company.domain}`,
    });
  }

  const existingSkill = await db.query.skills.findFirst({
    columns: { id: true },
    where: eq(skills.organizationId, company.organizationId),
  });
  if (!existingSkill) {
    const sourceSkills = await db
      .select({
        content: skills.content,
        description: skills.description,
        isSystem: skills.isSystem,
        name: skills.name,
      })
      .from(skills)
      .where(
        eq(
          skills.organizationId,
          ONBOARDING_EVALUATION_SKILL_SOURCE_ORGANIZATION_ID
        )
      );
    if (sourceSkills.length === 0) {
      throw new Error("No source skills available for Mintlify evaluation");
    }
    await db.insert(skills).values(
      sourceSkills.map((skill) => ({
        ...skill,
        id: randomUUID(),
        organizationId: company.organizationId,
      }))
    );
  }
}

async function snapshotCompany(
  company: (typeof ONBOARDING_EVALUATION_COMPANIES)[number]
): Promise<EvaluationCompanySnapshot> {
  const settings = await db.query.brandSettings.findFirst({
    columns: { id: true },
    where: and(
      eq(brandSettings.organizationId, company.organizationId),
      eq(brandSettings.isDefault, true)
    ),
  });
  const references = settings
    ? await db
        .select({
          applicableTo: brandReferences.applicableTo,
          content: brandReferences.content,
          createdAt: brandReferences.createdAt,
          id: brandReferences.id,
          metadata: brandReferences.metadata,
          note: brandReferences.note,
          type: brandReferences.type,
        })
        .from(brandReferences)
        .where(eq(brandReferences.brandSettingsId, settings.id))
        .orderBy(asc(brandReferences.createdAt))
    : [];
  const organizationSkills = await db
    .select({
      content: skills.content,
      id: skills.id,
      name: skills.name,
      updatedAt: skills.updatedAt,
    })
    .from(skills)
    .where(eq(skills.organizationId, company.organizationId))
    .orderBy(asc(skills.name));

  return {
    domain: company.domain,
    organizationId: company.organizationId,
    organizationName: company.organizationName,
    references: references.map((reference) => ({
      ...reference,
      createdAt: reference.createdAt.toISOString(),
    })),
    skills: organizationSkills.map((skill) => ({
      ...skill,
      updatedAt: skill.updatedAt.toISOString(),
    })),
  };
}

await ensureMintlifyEvaluationOrganization();

const evaluationId = `evaluation-${new Date().toISOString().replaceAll(":", "-")}`;
const evaluationDirectory = path.join(
  process.cwd(),
  "logs",
  "evaluations",
  evaluationId
);
await mkdir(evaluationDirectory, { recursive: true });

const companies = await Promise.all(
  ONBOARDING_EVALUATION_COMPANIES.map(snapshotCompany)
);
const startedAt = new Date();
for (const company of ONBOARDING_EVALUATION_COMPANIES) {
  await db
    .update(organizations)
    .set({ onboardingAgentRan: false, onboardingAgentStartedAt: startedAt })
    .where(eq(organizations.id, company.organizationId));
}

const host = process.env.EVE_ONBOARDING_AGENT_URL?.trim();
if (!host) {
  throw new Error("EVE_ONBOARDING_AGENT_URL is not configured");
}

const sessionEntries = await Promise.all(
  ONBOARDING_EVALUATION_COMPANIES.map(async (company) => {
    const auth = await getEveServiceAuth();
    const client = new Client({
      ...(auth ? { auth } : {}),
      headers: {
        [EVE_AGENT_ORGANIZATION_HEADER]: company.organizationId,
      },
      host,
      redirect: "error",
    });
    const response = await client.session().send({
      message: `Research the company at the domain ${company.domain} and produce the onboarding profile. This is an organization-scoped run. Persist memories, brand updates, 25 to 50 deduplicated owned-writing references across complete original tweets and concise owned-blog excerpts when that much public material is available, suggestions, and evidence-based skill edits. Use the bulk reference and page-scraping tools.`,
    });
    return [company.domain, response.sessionId] as const;
  })
);

const state: OnboardingEvaluationState = {
  companies,
  evaluationId,
  sessionIds: Object.fromEntries(sessionEntries),
  startedAt: startedAt.toISOString(),
};
await writeFile(
  path.join(evaluationDirectory, "state.json"),
  JSON.stringify(state, null, 2)
);

console.log(evaluationDirectory);
console.log(JSON.stringify(state.sessionIds, null, 2));
