import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { UIMessage } from "ai";
import { stampUserMessageAuthors } from "./chat";

function userMessage(id: string, authorUserId?: string): UIMessage {
  return {
    id,
    role: "user",
    parts: [{ type: "text", text: id }],
    metadata: authorUserId ? { authorUserId } : undefined,
  };
}

function assistantMessage(id: string): UIMessage {
  return {
    id,
    role: "assistant",
    parts: [{ type: "text", text: id }],
  };
}

describe("stampUserMessageAuthors", () => {
  test("stamps only the latest user message with the authenticated user", () => {
    const messages = [
      userMessage("older"),
      assistantMessage("reply"),
      userMessage("latest"),
    ];

    const stamped = stampUserMessageAuthors(messages, "user-b");

    assert.equal(
      (stamped[0]?.metadata as { authorUserId?: string } | undefined)
        ?.authorUserId,
      undefined
    );
    assert.equal(
      (stamped[2]?.metadata as { authorUserId?: string } | undefined)
        ?.authorUserId,
      "user-b"
    );
  });

  test("does not rewrite an earlier author's message when someone else continues", () => {
    const messages = [
      userMessage("from-a", "user-a"),
      assistantMessage("reply"),
      userMessage("from-b"),
    ];

    const stamped = stampUserMessageAuthors(messages, "user-b");

    assert.equal(
      (stamped[0]?.metadata as { authorUserId?: string }).authorUserId,
      "user-a"
    );
    assert.equal(
      (stamped[2]?.metadata as { authorUserId?: string }).authorUserId,
      "user-b"
    );
  });

  test("overwrites a spoofed author on the latest user message", () => {
    const messages = [userMessage("spoofed", "user-a")];
    const stamped = stampUserMessageAuthors(messages, "user-b");

    assert.equal(
      (stamped[0]?.metadata as { authorUserId?: string }).authorUserId,
      "user-b"
    );
  });

  test("returns the same array when the latest user message is already stamped", () => {
    const messages = [userMessage("latest", "user-a")];
    assert.equal(stampUserMessageAuthors(messages, "user-a"), messages);
  });
});
