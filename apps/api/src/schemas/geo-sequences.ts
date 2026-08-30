import { z } from "@hono/zod-openapi";

import {
  GEO_SEQUENCE_MAX_STEPS,
  GEO_SEQUENCE_NAME_MAX_LENGTH,
} from "../constants/geo-schemas";
import { organizationResponseSchema } from "./content";
import { geoPromptTextSchema } from "./geo-fields";

const sequenceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    steps: z.array(z.string()),
    enabled: z.boolean(),
    createdAt: z.string(),
  })
  .openapi("GeoSequence");

const sequenceStepsSchema = z
  .array(geoPromptTextSchema)
  .min(1)
  .max(GEO_SEQUENCE_MAX_STEPS);

export const listSequencesResponseSchema = z
  .object({
    sequences: z.array(sequenceSchema),
    organization: organizationResponseSchema,
  })
  .openapi("ListGeoSequencesResponse");

export const sequenceResponseSchema = z
  .object({
    sequence: sequenceSchema,
    organization: organizationResponseSchema,
  })
  .openapi("GeoSequenceResponse");

export const createSequenceRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(GEO_SEQUENCE_NAME_MAX_LENGTH),
    steps: sequenceStepsSchema,
  })
  .openapi("CreateGeoSequenceRequest");

export const patchSequenceRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(GEO_SEQUENCE_NAME_MAX_LENGTH).optional(),
    steps: sequenceStepsSchema.optional(),
    enabled: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.steps !== undefined ||
      value.enabled !== undefined,
    { message: "Provide at least one field to update" }
  )
  .openapi("PatchGeoSequenceRequest");

export const deleteSequenceResponseSchema = z
  .object({
    id: z.string(),
    organization: organizationResponseSchema,
  })
  .openapi("DeleteGeoSequenceResponse");

export const runSequenceResponseSchema = z
  .object({
    checks: z.number().int().openapi({
      description: "Recorded answers across every engine that responded.",
    }),
    mentions: z.number().int().openapi({
      description: "How many of those answers mentioned the tracked brand.",
    }),
    engines: z.array(z.string()).openapi({
      description: "Engines the conversation was played against.",
    }),
    organization: organizationResponseSchema,
  })
  .openapi("RunGeoSequenceResponse");
