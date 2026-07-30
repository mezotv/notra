import { flushContentEmailDigest } from "@/lib/workflows/shared/content-email-digest";
import type { ContentEmailDigestPayload } from "@/schemas/workflows";

export async function flushContentEmailDigestStep(
  payload: ContentEmailDigestPayload
): Promise<void> {
  "use step";
  await flushContentEmailDigest(payload);
}
