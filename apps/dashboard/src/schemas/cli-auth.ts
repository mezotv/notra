// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const cliSessionIdSchema = z
  .string()
  .min(32)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

export const cliPollSecretSchema = z
  .string()
  .length(43)
  .regex(/^[A-Za-z0-9_-]+$/);

export const cliPollSecretHashSchema = z
  .string()
  .length(43)
  .regex(/^[A-Za-z0-9_-]+$/);

export const initializeCliSessionSchema = z.object({
  pollSecretHash: cliPollSecretHashSchema,
});

export const authorizeCliSessionSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
});

export type AuthorizeCliSessionInput = z.infer<
  typeof authorizeCliSessionSchema
>;

export const CLI_SESSION_TTL_MS = 5 * 60 * 1000;
