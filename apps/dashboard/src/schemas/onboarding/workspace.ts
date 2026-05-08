// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import {
  organizationNameSchema,
  organizationSlugSchema,
} from "@/schemas/organization";

const TOP_LEVEL_DOMAIN_REGEX = /^[a-z]{2,63}$/i;
const IPV4_REGEX = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const IPV6_REGEX = /^[0-9a-f:]+$/i;

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

    if (IPV4_REGEX.test(hostname) || IPV6_REGEX.test(hostname)) {
      return false;
    }

    const labels = hostname.split(".").filter(Boolean);
    const topLevelDomain = labels.at(-1);

    return (
      labels.length >= 2 &&
      !!topLevelDomain &&
      TOP_LEVEL_DOMAIN_REGEX.test(topLevelDomain)
    );
  } catch {
    return false;
  }
}

export const onboardingWorkspaceSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema,
  websiteUrl: z
    .string()
    .url("Please enter a valid URL (e.g., https://example.com)")
    .refine(isValidPublicWebsiteUrl, {
      message:
        "Please enter a valid public website URL (e.g., https://example.com)",
    })
    .optional(),
});

export type OnboardingWorkspaceInput = z.infer<
  typeof onboardingWorkspaceSchema
>;
