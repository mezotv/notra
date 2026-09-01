import "zod/compile";
import { z } from "@hono/zod-openapi";
import {
  GEO_MAX_ALIASES,
  GEO_MAX_ENGINES,
  GEO_MAX_LANGUAGES,
  GEO_SCAN_INTERVAL_HOURS,
  GEO_SHORT_FIELD_MAX_LENGTH,
} from "@notra/geo-core/constants/geo";

import { organizationResponseSchema } from "./content";
import { createGeoShortTextSchema } from "./geo-fields";

const settingsSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    projectId: z.string(),
    companyName: z.string(),
    aliases: z.array(z.string()),
    competitors: z.array(z.string()),
    languages: z.array(z.string()),
    engines: z.array(z.string()),
    enforceZdr: z.boolean(),
    nonZdrApprovedEngines: z.array(z.string()),
    enabled: z.boolean(),
    scanIntervalHours: z.number().int(),
    scanStartedAt: z.string().nullable(),
    lastScanAt: z.string().nullable(),
    isScanning: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("GeoSettings");

export const settingsResponseSchema = z
  .object({
    configured: z.boolean().openapi({
      description: "Whether the analytics backend is configured.",
    }),
    settings: settingsSchema.nullable(),
    organization: organizationResponseSchema,
  })
  .openapi("GeoSettingsResponse");

export const patchSettingsRequestSchema = z
  .object({
    companyName: z.string().trim().min(1).max(GEO_SHORT_FIELD_MAX_LENGTH),
    aliases: z.array(createGeoShortTextSchema()).max(GEO_MAX_ALIASES),
    languages: z
      .array(createGeoShortTextSchema())
      .min(1)
      .max(GEO_MAX_LANGUAGES),
    engines: z.array(createGeoShortTextSchema()).min(1).max(GEO_MAX_ENGINES),
    enforceZdr: z.boolean(),
    nonZdrApprovedEngines: z
      .array(createGeoShortTextSchema())
      .max(GEO_MAX_ENGINES),
    enabled: z.boolean(),
    scanIntervalHours: z
      .number()
      .int()
      .refine(
        (value) => GEO_SCAN_INTERVAL_HOURS.some((hours) => hours === value),
        { message: "Unsupported scan interval" }
      )
      .openapi({ description: GEO_SCAN_INTERVAL_HOURS.join(", ") }),
  })
  .openapi("PatchGeoSettingsRequest");
