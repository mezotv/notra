import { brandIdentityToolOutputSchema } from "@/schemas/brand";

export function getWebsiteDomain(websiteUrl: string | null): string | null {
  if (!websiteUrl) {
    return null;
  }
  const normalizedUrl = websiteUrl.startsWith("http")
    ? websiteUrl
    : `https://${websiteUrl}`;
  try {
    return new URL(normalizedUrl).hostname;
  } catch {
    return null;
  }
}

export function getBrandFaviconUrl(websiteUrl: string | null) {
  if (!websiteUrl) {
    return undefined;
  }
  const normalizedUrl = websiteUrl.startsWith("http")
    ? websiteUrl
    : `https://${websiteUrl}`;
  try {
    return `https://icons.duckduckgo.com/ip3/${new URL(normalizedUrl).hostname}.ico`;
  } catch {
    return undefined;
  }
}

export function getBrandFaviconFromToolOutput(
  toolName: string,
  output: unknown
) {
  const parsed = brandIdentityToolOutputSchema.safeParse(output);
  if (!parsed.success) {
    return undefined;
  }

  if (toolName === "getBrandIdentity") {
    return getBrandFaviconUrl(parsed.data.brandIdentity?.websiteUrl ?? null);
  }

  if (toolName === "listBrandIdentities") {
    const identities = parsed.data.brandIdentities;
    if (identities?.length === 1) {
      return getBrandFaviconUrl(identities[0]?.websiteUrl ?? null);
    }
  }

  return undefined;
}
