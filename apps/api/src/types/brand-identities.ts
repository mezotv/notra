import type { brandSettings } from "@notra/db/schema";

export type BrandIdentityRow = Pick<
  typeof brandSettings.$inferSelect,
  | "id"
  | "name"
  | "isDefault"
  | "websiteUrl"
  | "companyName"
  | "companyDescription"
  | "toneProfile"
  | "customTone"
  | "customInstructions"
  | "audience"
  | "language"
  | "createdAt"
  | "updatedAt"
>;
