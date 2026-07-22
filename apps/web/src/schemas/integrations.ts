// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

const integrationToolSchema = z.object({
  name: z.string(),
  title: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  description: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
});

const integrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  author: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  websiteUrl: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  brandColor: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  logoLightUrl: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  logoDarkUrl: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  bannerUrl: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  slug: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  authType: z.string(),
  indexedToolCount: z.number(),
  tools: z.array(integrationToolSchema).default([]),
});

export const integrationListResponseSchema = z.object({
  integrations: z.array(integrationSchema),
});

export const integrationDetailResponseSchema = z.object({
  integration: integrationSchema,
});
