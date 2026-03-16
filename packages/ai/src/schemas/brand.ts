// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const toneProfileSchema = z.enum([
  "Conversational",
  "Professional",
  "Casual",
  "Formal",
]);

export type ToneProfile = z.infer<typeof toneProfileSchema>;

export function getValidToneProfile(
  value: unknown,
  fallback: ToneProfile = "Conversational"
): ToneProfile {
  const parsed = toneProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}
