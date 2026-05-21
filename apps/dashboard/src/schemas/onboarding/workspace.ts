// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import {
  ONBOARDING_WEBSITE_IPV4_REGEX,
  ONBOARDING_WEBSITE_IPV6_REGEX,
  ONBOARDING_WEBSITE_PREFIX_REGEX,
  ONBOARDING_WEBSITE_TOP_LEVEL_DOMAIN_REGEX,
} from "@/constants/onboarding";
import {
  organizationNameSchema,
  organizationSlugSchema,
} from "@/schemas/organization";

export function normalizeOnboardingWebsiteUrl(value: string) {
  const trimmed = value.trim();
  return ONBOARDING_WEBSITE_PREFIX_REGEX.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
}

const optionalWebsiteUrlSchema = z
  .string()
  .trim()
  .transform((value) =>
    value ? normalizeOnboardingWebsiteUrl(value) : undefined
  )
  .pipe(
    z
      .string()
      .url("Please enter a valid URL (e.g., https://example.com)")
      .refine(isValidPublicWebsiteUrl, {
        message:
          "Please enter a valid public website URL (e.g., https://example.com)",
      })
      .optional()
  );

function isValidPublicWebsiteUrl(value: string) {
  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    if (parsed.username || parsed.password) {
      return false;
    }

    const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();

    if (!hostname) {
      return false;
    }

    if (
      hostname === "localhost" ||
      hostname === "metadata" ||
      hostname === "metadata.google.internal" ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".localhost")
    ) {
      return false;
    }

    if (
      ONBOARDING_WEBSITE_IPV4_REGEX.test(hostname) ||
      ONBOARDING_WEBSITE_IPV6_REGEX.test(hostname)
    ) {
      return false;
    }

    const labels = hostname.split(".").filter(Boolean);
    const topLevelDomain = labels.at(-1);

    return (
      labels.length >= 2 &&
      !!topLevelDomain &&
      ONBOARDING_WEBSITE_TOP_LEVEL_DOMAIN_REGEX.test(topLevelDomain)
    );
  } catch {
    return false;
  }
}

export const onboardingWorkspaceSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema,
  websiteUrl: optionalWebsiteUrlSchema,
});

export type OnboardingWorkspaceInput = z.infer<
  typeof onboardingWorkspaceSchema
>;
