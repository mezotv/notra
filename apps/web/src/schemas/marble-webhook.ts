// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

const marbleWebhookEventSchema = z.templateLiteral([
  z.string(),
  ".",
  z.string(),
]);

const optionalStringSchema = z
  .string()
  .nullish()
  .transform((value) => value ?? undefined);

const marbleWebhookCategorySchema = z
  .union([z.string(), z.object({ slug: optionalStringSchema })])
  .nullish()
  .transform((value) => value ?? undefined);

export const marbleWebhookPayloadSchema = z.object({
  event: marbleWebhookEventSchema.optional(),
  type: marbleWebhookEventSchema.optional(),
  data: z
    .object({
      slug: optionalStringSchema,
      category: marbleWebhookCategorySchema,
      categorySlug: optionalStringSchema,
    })
    .optional(),
});
