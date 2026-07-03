import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "../drizzle";
import {
  brandGuidelineColors,
  brandGuidelines,
  brandSettings,
  organizations,
  sessions,
} from "../schema";

const DEFAULT_BRAND_NAME = "Upload QA Brand";
const DEFAULT_COMPANY_NAME = "Notra Upload QA";
const DEFAULT_WEBSITE_URL = "https://notra.sh";
const SEEDED_COLOR_NAME = "QA Purple";

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));

  if (inline) {
    return inline.slice(prefix.length).trim() || null;
  }

  const index = process.argv.indexOf(`--${name}`);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  return value && !value.startsWith("--") ? value.trim() : null;
}

async function getOrganizationIdFromSlug(slug: string) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    columns: { id: true },
  });

  if (!organization) {
    throw new Error(`No organization found for slug "${slug}"`);
  }

  return organization.id;
}

async function getFallbackOrganizationId() {
  const activeSession = await db.query.sessions.findFirst({
    where: isNotNull(sessions.activeOrganizationId),
    orderBy: [desc(sessions.updatedAt)],
    columns: { activeOrganizationId: true },
  });

  if (activeSession?.activeOrganizationId) {
    return activeSession.activeOrganizationId;
  }

  const organization = await db.query.organizations.findFirst({
    orderBy: [desc(organizations.createdAt)],
    columns: { id: true },
  });

  return organization?.id ?? null;
}

async function resolveOrganizationId() {
  const explicitOrgId =
    getArgValue("org-id") ?? process.env.SEED_ORGANIZATION_ID?.trim();

  if (explicitOrgId) {
    return explicitOrgId;
  }

  const slug = getArgValue("org-slug") ?? process.env.SEED_ORGANIZATION_SLUG;

  if (slug) {
    return getOrganizationIdFromSlug(slug);
  }

  const organizationId = await getFallbackOrganizationId();

  if (!organizationId) {
    throw new Error(
      "No organization found. Create an organization first or pass --org-id."
    );
  }

  return organizationId;
}

async function seedBrandIdentity() {
  const organizationId = await resolveOrganizationId();
  const name =
    getArgValue("name") ?? process.env.SEED_BRAND_NAME ?? DEFAULT_BRAND_NAME;
  const websiteUrl =
    getArgValue("website-url") ??
    process.env.SEED_BRAND_WEBSITE_URL ??
    DEFAULT_WEBSITE_URL;
  const companyName =
    getArgValue("company-name") ??
    process.env.SEED_BRAND_COMPANY_NAME ??
    DEFAULT_COMPANY_NAME;

  const existingBrandIdentity = await db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.organizationId, organizationId),
      eq(brandSettings.name, name)
    ),
    columns: { id: true },
  });
  const hasAnyBrandIdentity = await db.query.brandSettings.findFirst({
    where: eq(brandSettings.organizationId, organizationId),
    columns: { id: true },
  });
  const now = new Date();

  const brandIdentityId = existingBrandIdentity?.id ?? crypto.randomUUID();

  if (existingBrandIdentity) {
    await db
      .update(brandSettings)
      .set({
        audience:
          "Product teams validating brand guideline uploads and asset handling.",
        companyDescription:
          "A local QA brand identity for testing brand guideline asset uploads.",
        companyName,
        customInstructions:
          "Use this identity for local upload QA. It can be deleted safely.",
        customTone: "Clear, direct, and product-focused.",
        language: "English",
        toneProfile: "Professional",
        updatedAt: now,
        websiteUrl,
      })
      .where(eq(brandSettings.id, brandIdentityId));
  } else {
    await db.insert(brandSettings).values({
      id: brandIdentityId,
      organizationId,
      name,
      isDefault: !hasAnyBrandIdentity,
      websiteUrl,
      companyName,
      companyDescription:
        "A local QA brand identity for testing brand guideline asset uploads.",
      toneProfile: "Professional",
      customTone: "Clear, direct, and product-focused.",
      customInstructions:
        "Use this identity for local upload QA. It can be deleted safely.",
      audience:
        "Product teams validating brand guideline uploads and asset handling.",
      language: "English",
      createdAt: now,
      updatedAt: now,
    });
  }

  const existingGuideline = await db.query.brandGuidelines.findFirst({
    where: eq(brandGuidelines.brandSettingsId, brandIdentityId),
    columns: { id: true },
  });
  const guidelineId = existingGuideline?.id ?? crypto.randomUUID();

  if (existingGuideline) {
    await db
      .update(brandGuidelines)
      .set({
        status: "ready",
        lastGenerationError: null,
        updatedAt: now,
      })
      .where(eq(brandGuidelines.id, guidelineId));
  } else {
    await db.insert(brandGuidelines).values({
      id: guidelineId,
      brandSettingsId: brandIdentityId,
      status: "ready",
      contextDevMeta: { seed: "seed-brand-identity" },
      lastGeneratedAt: null,
      lastGenerationError: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  const existingSeededColor = await db.query.brandGuidelineColors.findFirst({
    where: and(
      eq(brandGuidelineColors.guidelineId, guidelineId),
      eq(brandGuidelineColors.name, SEEDED_COLOR_NAME)
    ),
    columns: { id: true },
  });

  if (existingSeededColor) {
    await db
      .update(brandGuidelineColors)
      .set({
        lightValue: "#c8b2ee",
        darkValue: "#9d7ad9",
        usage: "Seed color to keep guideline sections visible for upload QA.",
        updatedAt: now,
      })
      .where(eq(brandGuidelineColors.id, existingSeededColor.id));
  } else {
    await db.insert(brandGuidelineColors).values({
      id: crypto.randomUUID(),
      guidelineId,
      role: "primary",
      name: SEEDED_COLOR_NAME,
      lightValue: "#c8b2ee",
      darkValue: "#9d7ad9",
      usage: "Seed color to keep guideline sections visible for upload QA.",
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.info("Seeded brand identity for upload QA", {
    brandIdentityId,
    guidelineId,
    name,
    organizationId,
  });
}

seedBrandIdentity()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
