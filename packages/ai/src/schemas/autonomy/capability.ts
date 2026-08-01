// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const CAPABILITY_NAME_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
export const CAPABILITY_NAME_MAX_LENGTH = 64;
export const CAPABILITY_DESCRIPTION_MAX_LENGTH = 500;
export const CAPABILITY_MIN_VERSION = 1;
export const CAPABILITY_MIN_ATTEMPTS = 1;
export const CAPABILITY_MAX_ATTEMPTS = 10;
export const CAPABILITY_GRANT_MAX_RESOURCE_IDS = 100;

export const capabilityNameSchema = z
  .string()
  .max(CAPABILITY_NAME_MAX_LENGTH)
  .regex(CAPABILITY_NAME_PATTERN);
export type CapabilityName = z.infer<typeof capabilityNameSchema>;

export const capabilitySideEffectSchema = z.enum([
  "read",
  "write_internal",
  "write_external",
]);
export type CapabilitySideEffect = z.infer<typeof capabilitySideEffectSchema>;

export const capabilityIdempotencySchema = z.enum(["keyed", "natural", "none"]);
export type CapabilityIdempotency = z.infer<typeof capabilityIdempotencySchema>;

export const capabilityDescriptorSchema = z.object({
  name: capabilityNameSchema,
  version: z.number().int().min(CAPABILITY_MIN_VERSION),
  description: z.string().min(1).max(CAPABILITY_DESCRIPTION_MAX_LENGTH),
  sideEffect: capabilitySideEffectSchema,
  idempotency: capabilityIdempotencySchema,
  requiresVerification: z.boolean(),
  maxAttempts: z
    .number()
    .int()
    .min(CAPABILITY_MIN_ATTEMPTS)
    .max(CAPABILITY_MAX_ATTEMPTS),
});
export type CapabilityDescriptor = z.infer<typeof capabilityDescriptorSchema>;

export const capabilityGrantSchema = z.object({
  name: capabilityNameSchema,
  version: z.number().int().min(CAPABILITY_MIN_VERSION),
  resourceIds: z
    .array(z.string().min(1))
    .max(CAPABILITY_GRANT_MAX_RESOURCE_IDS),
});
export type CapabilityGrant = z.infer<typeof capabilityGrantSchema>;
