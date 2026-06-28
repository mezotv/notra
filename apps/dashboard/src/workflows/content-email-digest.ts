import { sleep } from "workflow";
import { CONTENT_EMAIL_DIGEST_DELAY } from "@/constants/workflows";
import { flushContentEmailDigest } from "@/lib/workflows/shared/content-email-digest";
import {
  type ContentEmailDigestPayload,
  contentEmailDigestPayloadSchema,
} from "@/schemas/workflows";

export async function contentEmailDigestWorkflow(
  payload: ContentEmailDigestPayload
) {
  "use workflow";

  const parsedPayload = contentEmailDigestPayloadSchema.parse(payload);
  await sleep(CONTENT_EMAIL_DIGEST_DELAY);
  await flushContentEmailDigest(parsedPayload);
}
