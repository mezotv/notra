// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

export const editOperationSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("replaceLine"),
    line: z.number().describe("The line number to replace (1-indexed)"),
    content: z.string().describe("The new content for the line"),
  }),
  z.object({
    op: z.literal("replaceRange"),
    startLine: z.number().describe("The starting line number (1-indexed)"),
    endLine: z.number().describe("The ending line number (1-indexed)"),
    content: z
      .string()
      .describe("The new content (use \\n for multiple lines)"),
  }),
  z.object({
    op: z.literal("insert"),
    afterLine: z
      .number()
      .describe("Line number after which to insert (0 for start)"),
    content: z.string().describe("The content to insert"),
  }),
  z.object({
    op: z.literal("deleteLine"),
    line: z.number().describe("The line number to delete (1-indexed)"),
  }),
  z.object({
    op: z.literal("deleteRange"),
    startLine: z
      .number()
      .describe("The starting line number to delete (1-indexed)"),
    endLine: z
      .number()
      .describe("The ending line number to delete (1-indexed)"),
  }),
]);

export type EditOperation = z.infer<typeof editOperationSchema>;

export const getLinearIssuesInputSchema = z.object({
  integrationId: z
    .string()
    .describe("The integration ID for the configured Linear workspace"),
  since: z
    .string()
    .datetime()
    .optional()
    .describe(
      "UTC ISO timestamp for the start of the range (filters by updatedAt)"
    ),
  until: z
    .string()
    .datetime()
    .optional()
    .describe(
      "UTC ISO timestamp for the end of the range (filters by updatedAt)"
    ),
  cursor: z
    .string()
    .optional()
    .describe("Pagination cursor from a previous response"),
  includeCompleted: z
    .boolean()
    .default(true)
    .describe("Whether to include completed/cancelled issues"),
});
