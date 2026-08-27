import { sleep } from "workflow";

import { CONTENT_EMAIL_DIGEST_DELAY } from "@/constants/workflows";
import {
  type ContentEmailDigestPayload,
  contentEmailDigestPayloadSchema,
} from "@/schemas/workflows";

import { flushContentEmailDigestStep } from "./steps/content-email-digest-step";

export async function contentEmailDigestWorkflow(
  payload: ContentEmailDigestPayload
) {
  "use workflow";

  const parsedPayload = contentEmailDigestPayloadSchema.parse(payload);
  await sleep(CONTENT_EMAIL_DIGEST_DELAY);
  await flushContentEmailDigestStep(parsedPayload);
}
