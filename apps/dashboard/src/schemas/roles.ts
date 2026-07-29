import { ORGANIZATION_SCOPES } from "@notra/db/constants/permissions";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { organizationIdSchema } from "./auth/organization";

const organizationScopeSchema = z.enum(ORGANIZATION_SCOPES);

const roleNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(64, "Name must be 64 characters or fewer");

const roleDescriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must be 500 characters or fewer");

const roleScopesSchema = z
  .array(organizationScopeSchema)
  .min(1, "Select at least one permission")
  .max(ORGANIZATION_SCOPES.length);

export const rolesListInputSchema = z.object({
  organizationId: organizationIdSchema,
});

export const roleInputSchema = z.object({
  organizationId: organizationIdSchema,
  roleId: z.string().min(1, "Role ID is required"),
});

export const createRoleInputSchema = z.object({
  organizationId: organizationIdSchema,
  name: roleNameSchema,
  description: roleDescriptionSchema.optional(),
  scopes: roleScopesSchema,
});

export const updateRoleInputSchema = roleInputSchema.extend({
  name: roleNameSchema.optional(),
  description: roleDescriptionSchema.nullable().optional(),
  scopes: roleScopesSchema.optional(),
});

export const assignRoleInputSchema = z.object({
  organizationId: organizationIdSchema,
  memberId: z.string().min(1, "Member ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

export type CreateRoleInput = z.infer<typeof createRoleInputSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleInputSchema>;
