// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { organizationIdSchema } from "./auth/organization";

const reviewDecisionSchema = z.enum(["approved", "changes_requested"]);

const reviewCommentSchema = z
  .string()
  .trim()
  .max(2000, "Comment must be 2000 characters or fewer");

export const submitForReviewInputSchema = z.object({
  organizationId: organizationIdSchema,
  contentId: z.string().min(1, "Content ID is required"),
});

export const reviewPostInputSchema = z.object({
  organizationId: organizationIdSchema,
  contentId: z.string().min(1, "Content ID is required"),
  decision: reviewDecisionSchema,
  comment: reviewCommentSchema.optional(),
});

export const reviewStateInputSchema = z.object({
  organizationId: organizationIdSchema,
  contentId: z.string().min(1, "Content ID is required"),
});

export const reviewsInboxInputSchema = z.object({
  organizationId: organizationIdSchema,
});

const workflowStepInputSchema = z.object({
  reviewerRoleId: z.string().min(1, "Reviewer role is required"),
  requiredApprovals: z.number().int().min(1).max(10),
  name: z
    .string()
    .trim()
    .max(100, "Step name must be 100 characters or fewer")
    .nullable()
    .optional(),
});

const workflowNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be 100 characters or fewer");

const workflowDescriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must be 500 characters or fewer");

export const workflowsListInputSchema = z.object({
  organizationId: organizationIdSchema,
});

export const workflowInputSchema = z.object({
  organizationId: organizationIdSchema,
  workflowId: z.string().min(1, "Workflow ID is required"),
});

export const createWorkflowInputSchema = z.object({
  organizationId: organizationIdSchema,
  name: workflowNameSchema,
  description: workflowDescriptionSchema.optional(),
  appliesToRoleId: z.string().min(1).nullable().optional(),
  isDefault: z.boolean().optional(),
  steps: z.array(workflowStepInputSchema).min(1).max(10),
});

export const updateWorkflowInputSchema = workflowInputSchema.extend({
  name: workflowNameSchema.optional(),
  description: workflowDescriptionSchema.nullable().optional(),
  appliesToRoleId: z.string().min(1).nullable().optional(),
  isDefault: z.boolean().optional(),
  steps: z.array(workflowStepInputSchema).min(1).max(10).optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowInputSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowInputSchema>;
