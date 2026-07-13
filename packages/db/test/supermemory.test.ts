import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createHash } from "node:crypto";
import { SUPERMEMORY_BASE_URL } from "../src/constants/supermemory";
import type { BrandReferenceMemoryPayload } from "../src/types/supermemory";
import {
  createBrandReferenceMemory,
  deleteBrandReferenceMemory,
  getBrandReferenceContainerTag,
  getBrandReferenceMemoryCustomId,
  getBrandReferenceMemorySyncHash,
  searchBrandReferenceMemories,
} from "../src/utils/supermemory";

const originalApiKey = process.env.SUPERMEMORY_API_KEY;
const originalFetch = globalThis.fetch;
const SUPERMEMORY_IDENTIFIER_REGEX = /^[a-zA-Z0-9_.-]+$/;

const payload: BrandReferenceMemoryPayload = {
  applicableTo: ["twitter"],
  content: "A complete reference post.",
  note: "Product launch",
  organizationId: "org_123",
  referenceId: "123e4567-e89b-12d3-a456-426614174000",
  sourceUrl: "https://x.com/notra/status/123",
  tweetId: "123",
  type: "twitter_post",
  voiceId: "voice_123",
};

beforeEach(() => {
  process.env.SUPERMEMORY_API_KEY = "test-key";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.SUPERMEMORY_API_KEY = originalApiKey;
});

describe("brand reference Supermemory documents", () => {
  test("builds a stable versioned custom ID", () => {
    const referenceHash = createHash("sha256")
      .update(payload.referenceId)
      .digest("hex");
    const syncHash = getBrandReferenceMemorySyncHash(payload);
    const customId = getBrandReferenceMemoryCustomId(payload);

    expect(customId).toBe(
      `brand-reference-${referenceHash.slice(0, 32)}-${syncHash.slice(0, 32)}`
    );
    expect(customId.length).toBeLessThanOrEqual(100);
    expect(customId).toMatch(SUPERMEMORY_IDENTIFIER_REGEX);
    expect(
      getBrandReferenceMemoryCustomId({
        ...payload,
        content: "An edited reference post.",
      })
    ).not.toBe(customId);
  });

  test("bounds custom IDs for arbitrary persisted reference IDs", () => {
    const customId = getBrandReferenceMemoryCustomId({
      ...payload,
      referenceId: `unsafe/reference/${"x".repeat(300)}`,
    });

    expect(customId.length).toBeLessThanOrEqual(100);
    expect(customId).toMatch(SUPERMEMORY_IDENTIFIER_REGEX);
  });

  test("builds a bounded container tag for arbitrary voice IDs", () => {
    const containerTag = getBrandReferenceContainerTag(
      `unsafe/voice/${"x".repeat(300)}`
    );

    expect(containerTag.length).toBeLessThanOrEqual(100);
    expect(containerTag).toMatch(SUPERMEMORY_IDENTIFIER_REGEX);
    expect(containerTag).not.toContain(":");
  });

  test("creates one idempotent document and returns its document ID", async () => {
    const fetchMock = mock(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(JSON.stringify({ id: "doc_123", status: "queued" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        })
    );
    globalThis.fetch = fetchMock;

    const result = await createBrandReferenceMemory(payload);

    expect(result).toEqual({ documentId: "doc_123", memoryId: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${SUPERMEMORY_BASE_URL}/v3/documents`);
    expect(request?.method).toBe("POST");
    const body = JSON.parse(String(request?.body));
    expect(body.customId).toBe(getBrandReferenceMemoryCustomId(payload));
    expect(body.containerTag).toBe(
      getBrandReferenceContainerTag(payload.voiceId)
    );
    expect(body.containerTag).not.toContain(":");
    expect(body.content).toContain(payload.content);
    expect(body.metadata.referenceId).toBe(payload.referenceId);
    expect(body.metadata.syncHash).toBe(
      getBrandReferenceMemorySyncHash(payload)
    );
    expect(body.metadata.applicableToAll).toBe(false);
    expect(body.metadata.applicableToTwitter).toBe(true);
    expect(Object.values(body.metadata).some(Array.isArray)).toBe(false);
  });

  test("deletes uncertain creates by deterministic custom ID", async () => {
    const fetchMock = mock(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(null, { status: 204 })
    );
    globalThis.fetch = fetchMock;
    const customId = getBrandReferenceMemoryCustomId(payload);

    await deleteBrandReferenceMemory({ customId });

    const [url, request] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(
      `${SUPERMEMORY_BASE_URL}/v3/documents/${encodeURIComponent(customId)}`
    );
    expect(request?.method).toBe("DELETE");
  });

  test("filters searches with primitive platform flags", async () => {
    const fetchMock = mock(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(JSON.stringify({ results: [] }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        })
    );
    globalThis.fetch = fetchMock;

    await searchBrandReferenceMemories({
      applicableTo: "twitter",
      query: "product launch",
      voiceId: payload.voiceId,
    });

    const [, request] = fetchMock.mock.calls[0] ?? [];
    const body = JSON.parse(String(request?.body));
    expect(body.filters.AND[2]).toEqual({
      OR: [
        { key: "applicableToAll", value: true },
        { key: "applicableToTwitter", value: true },
      ],
    });
  });
});
