import { db } from "@notra/db/drizzle";
import { brandReferences, brandSettings } from "@notra/db/schema";
import { and, desc, eq } from "drizzle-orm";

interface BrandReferenceFilter {
  organizationId: string;
  voiceId?: string;
  agentType?: string;
}

type BrandReferenceRecord = Awaited<
  ReturnType<typeof db.query.brandReferences.findMany>
>[number];

async function resolveSettingsId(filter: BrandReferenceFilter) {
  if (filter.voiceId) {
    const voice = await db.query.brandSettings.findFirst({
      where: and(
        eq(brandSettings.id, filter.voiceId),
        eq(brandSettings.organizationId, filter.organizationId)
      ),
      columns: { id: true },
    });
    return voice?.id;
  }

  const defaultVoice = await db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.organizationId, filter.organizationId),
      eq(brandSettings.isDefault, true)
    ),
    columns: { id: true },
  });
  return defaultVoice?.id;
}

export async function getFilteredBrandReferences(
  filter: BrandReferenceFilter
): Promise<{
  settingsId: string | null;
  references: BrandReferenceRecord[];
}> {
  const settingsId = await resolveSettingsId(filter);
  if (!settingsId) {
    return { settingsId: null, references: [] };
  }

  const refs = await db.query.brandReferences.findMany({
    where: eq(brandReferences.brandSettingsId, settingsId),
    orderBy: [desc(brandReferences.createdAt)],
  });

  const agentType = filter.agentType;
  const filtered: BrandReferenceRecord[] = agentType
    ? refs.filter((reference: BrandReferenceRecord) => {
        const targets = reference.applicableTo as string[];
        return targets.includes("all") || targets.includes(agentType);
      })
    : refs;

  return { settingsId, references: filtered };
}
