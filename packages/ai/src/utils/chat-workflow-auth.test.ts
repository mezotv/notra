import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { UnsignedChatWorkflowPayload } from "../types/chat";
import {
  signChatWorkflowPayload,
  verifyChatWorkflowPayload,
} from "./chat-workflow-auth";

const payload: UnsignedChatWorkflowPayload = {
  requestId: "request-1",
  organizationId: "organization-1",
  chatId: "chat-1",
  userId: "user-1",
  context: [],
  useMarkup: false,
};

describe("chat workflow payload authorization", () => {
  test("accepts an intact signed payload", () => {
    const workflowSignature = signChatWorkflowPayload(payload, "secret");
    assert.equal(
      verifyChatWorkflowPayload({ ...payload, workflowSignature }, "secret"),
      true
    );
  });

  test("rejects tenant-id tampering", () => {
    const workflowSignature = signChatWorkflowPayload(payload, "secret");
    assert.equal(
      verifyChatWorkflowPayload(
        {
          ...payload,
          organizationId: "organization-2",
          workflowSignature,
        },
        "secret"
      ),
      false
    );
  });
});
