import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { collectToolOutputImages } from "./utils";

describe("collectToolOutputImages", () => {
  test("collects a generated image returned by the createImage tool", () => {
    const images = collectToolOutputImages({
      contentType: "image",
      imageUrl: "https://cdn.example.com/generated/launch-card.png",
      postId: "post_123",
      status: "created",
      title: "Launch card",
    });

    assert.deepEqual(images, [
      {
        filename: "Launch card",
        mediaType: "image/png",
        url: "https://cdn.example.com/generated/launch-card.png",
      },
    ]);
  });

  test("does not treat unrelated URLs as images", () => {
    const images = collectToolOutputImages({
      title: "Documentation",
      url: "https://example.com/docs",
    });

    assert.deepEqual(images, []);
  });
});
