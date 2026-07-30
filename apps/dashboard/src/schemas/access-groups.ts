import { ORGANIZATION_SCOPES } from "@notra/db/constants/permissions";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { organizationIdSchema } from "./auth/organization";

const organizationScopeSchema = z.enum(ORGANIZATION_SCOPES);

const groupNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(64, "Name must be 64 characters or fewer");

const groupDescriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must be 500 characters or fewer");

const groupScopesSchema = z
  .array(organizationScopeSchema)
  .min(1, "Select at least one permission")
  .max(ORGANIZATION_SCOPES.length);

export const accessGroupsListInputSchema = z.object({
  organizationId: organizationIdSchema,
});

export const accessGroupInputSchema = z.object({
  organizationId: organizationIdSchema,
  accessGroupId: z.string().min(1, "Access group ID is required"),
});

export const createAccessGroupInputSchema = z.object({
  organizationId: organizationIdSchema,
  name: groupNameSchema,
  description: groupDescriptionSchema.optional(),
  scopes: groupScopesSchema,
});

export const updateAccessGroupInputSchema = accessGroupInputSchema.extend({
  name: groupNameSchema.optional(),
  description: groupDescriptionSchema.nullable().optional(),
  scopes: groupScopesSchema.optional(),
});

export const assignAccessGroupInputSchema = z.object({
  organizationId: organizationIdSchema,
  memberId: z.string().min(1, "Member ID is required"),
  accessGroupId: z.string().min(1, "Access group ID is required"),
});

export type CreateAccessGroupInput = z.infer<
  typeof createAccessGroupInputSchema
>;
export type UpdateAccessGroupInput = z.infer<
  typeof updateAccessGroupInputSchema
>;
