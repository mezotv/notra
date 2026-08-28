// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

import { RESERVED_ORGANIZATION_SLUGS } from "@/constants/organization";

const organizationSlugSchema = z
  .string()
  .slugify()
  .min(3, "Organization slug must be at least 3 characters long")
  .max(63, "Organization slug must be at most 63 characters long")
  .refine(
    (value) =>
      !RESERVED_ORGANIZATION_SLUGS.includes(
        value as (typeof RESERVED_ORGANIZATION_SLUGS)[number]
      ),
    "This slug is reserved and cannot be used for an organization"
  );

const organizationNameSchema = z
  .string()
  .min(2, "Organization name must be at least 2 characters")
  .max(100, "Organization name must be at most 100 characters");

export const createOrganizationSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema,
});

const ORGANIZATION_LOGO_MAX_LENGTH = 2048;
const ORGANIZATION_SLUG_LOOKUP_MAX_LENGTH = 63;

const organizationIdSchema = z.string().min(1);

const organizationLogoSchema = z
  .string()
  .trim()
  .url("Logo must be a valid URL")
  .max(ORGANIZATION_LOGO_MAX_LENGTH, "Logo URL is too long");

const trimmedOrganizationSlugSchema = z
  .string()
  .trim()
  .pipe(organizationSlugSchema);

export const createOrganizationInputSchema = z.object({
  name: organizationNameSchema,
  slug: trimmedOrganizationSlugSchema,
  logo: organizationLogoSchema.optional(),
  keepCurrentActiveOrganization: z.boolean().optional(),
});

export const setActiveOrganizationInputSchema = z.object({
  organizationId: organizationIdSchema.optional(),
  organizationSlug: z
    .string()
    .trim()
    .min(1)
    .max(ORGANIZATION_SLUG_LOOKUP_MAX_LENGTH)
    .optional(),
});
