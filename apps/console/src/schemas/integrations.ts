// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const mcpUrlSchema = z
  .string()
  .trim()
  .min(1, "Server URL is required")
  .max(2048, "Server URL is too long")
  .pipe(z.url({ protocol: /^https$/ }));

export const mcpHeaderNameSchema = z
  .string()
  .trim()
  .max(128, "Header name is too long")
  .regex(/^[!#$%&'*+\-.^_`|~0-9A-Za-z]*$/, "Invalid header name");

export const mcpHeaderValueSchema = z
  .string()
  .trim()
  .max(4096, "Header value is too long");

export const MAX_MCP_HEADERS = 5;

export const mcpHeadersSchema = z
  .record(
    mcpHeaderNameSchema.pipe(z.string().min(1, "Header name is required")),
    mcpHeaderValueSchema.pipe(z.string().min(1, "Header value is required"))
  )
  .refine((headers) => Object.keys(headers).length <= MAX_MCP_HEADERS, {
    message: `You can add up to ${MAX_MCP_HEADERS} headers`,
  })
  .default({});

const createMcpServerRequestFieldsSchema = z.object({
  authType: z.enum(["none", "headers"]),
  organizationId: z.string().min(1, "Organization ID is required"),
  name: z.string().trim().min(1, "Name is required").max(120),
  url: mcpUrlSchema,
  description: z
    .string()
    .trim()
    .max(1000, "Description is too long")
    .optional()
    .nullable(),
  headers: mcpHeadersSchema,
});

export const createMcpServerRequestSchema =
  createMcpServerRequestFieldsSchema.superRefine((value, context) => {
    if (
      value.authType === "headers" &&
      Object.keys(value.headers).length === 0
    ) {
      context.addIssue({
        code: "custom",
        message: "Add at least one authentication header",
        path: ["headers"],
      });
    }
  });
export type CreateMcpServerRequest = z.infer<
  typeof createMcpServerRequestSchema
>;

export const testMcpServerRequestSchema =
  createMcpServerRequestFieldsSchema.pick({
    organizationId: true,
    url: true,
    headers: true,
  });
export type TestMcpServerRequest = z.infer<typeof testMcpServerRequestSchema>;
