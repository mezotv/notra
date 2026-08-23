import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  getContentChatAttachments,
  hasContentChatAttachments,
  snapshotContentChatAttachments,
} from "@/utils/content-chat-attachments";

const selection = {
  text: "Hello world",
  startLine: 2,
  startChar: 0,
  endLine: 4,
  endChar: 5,
};

describe("content chat attachments", () => {
  test("snapshots a selection and context for persistence", () => {
    const metadata = snapshotContentChatAttachments(selection, [
      {
        type: "github-repo",
        owner: "acme",
        repo: "docs",
        integrationId: "gh_1",
      },
    ]);

    assert.deepEqual(metadata.selection, selection);
    assert.equal(metadata.context?.length, 1);
  });

  test("reads persisted metadata and ignores invalid payloads", () => {
    const attachments = getContentChatAttachments({
      selection,
      context: [
        {
          type: "linear-team",
          integrationId: "lin_1",
          teamName: "Growth",
        },
      ],
    });

    assert.equal(hasContentChatAttachments(attachments), true);
    assert.deepEqual(attachments.selection, selection);
    assert.equal(attachments.context[0]?.type, "linear-team");
    assert.deepEqual(getContentChatAttachments({ selection: "nope" }), {
      selection: null,
      context: [],
    });
  });
});
