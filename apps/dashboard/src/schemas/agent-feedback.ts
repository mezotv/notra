import "zod/compile";
import {
  AGENT_FEEDBACK_KINDS,
  AGENT_FEEDBACK_STATUSES,
} from "@notra/db/constants/agent-feedback";
import { z } from "zod";

import { AGENT_FEEDBACK_PAGE_SIZE } from "@/constants/agent-feedback";
import { organizationIdSchema } from "@/schemas/auth/organization";

export const agentFeedbackOrganizationInputSchema = z.object({
  organizationId: organizationIdSchema,
});

export const agentFeedbackItemInputSchema = z.object({
  organizationId: organizationIdSchema,
  feedbackId: z.string().min(1),
});

export const agentFeedbackListInputSchema = z.object({
  organizationId: organizationIdSchema,
  status: z.enum(AGENT_FEEDBACK_STATUSES).optional(),
  kind: z.enum(AGENT_FEEDBACK_KINDS).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).default(AGENT_FEEDBACK_PAGE_SIZE),
});

export const agentFeedbackUpdateStatusInputSchema =
  agentFeedbackItemInputSchema.extend({
    status: z.enum(AGENT_FEEDBACK_STATUSES),
  });
