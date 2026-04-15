import { brandSettings } from "@notra/db/schema";

export function selectBrandIdentityColumns() {
  return {
    id: brandSettings.id,
    name: brandSettings.name,
    isDefault: brandSettings.isDefault,
    websiteUrl: brandSettings.websiteUrl,
    companyName: brandSettings.companyName,
    companyDescription: brandSettings.companyDescription,
    toneProfile: brandSettings.toneProfile,
    customTone: brandSettings.customTone,
    customInstructions: brandSettings.customInstructions,
    audience: brandSettings.audience,
    language: brandSettings.language,
    createdAt: brandSettings.createdAt,
    updatedAt: brandSettings.updatedAt,
  };
}
