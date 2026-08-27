import { createHmac, timingSafeEqual } from "node:crypto";

import type {
  ChatWorkflowPayload,
  UnsignedChatWorkflowPayload,
} from "../types/chat";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, canonicalize(entryValue)])
    );
  }

  return value;
}

export function signChatWorkflowPayload(
  payload: UnsignedChatWorkflowPayload,
  secret: string
) {
  const message = JSON.stringify(canonicalize(payload));
  return createHmac("sha256", secret).update(message).digest("hex");
}

export function verifyChatWorkflowPayload(
  payload: ChatWorkflowPayload,
  secret: string
) {
  const { workflowSignature, ...unsignedPayload } = payload;
  const expected = Buffer.from(
    signChatWorkflowPayload(unsignedPayload, secret),
    "hex"
  );
  const provided = Buffer.from(workflowSignature, "hex");

  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(expected, provided);
}
