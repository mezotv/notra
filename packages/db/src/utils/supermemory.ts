import { createHash } from "node:crypto";
import {
  SUPERMEMORY_BASE_URL,
  SUPERMEMORY_REQUEST_TIMEOUT_MS,
} from "../constants/supermemory";
import type {
  BrandReferenceMemoryLink,
  BrandReferenceMemoryPayload,
  SupermemorySearchResult,
} from "../types/supermemory";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getApiKey() {
  return process.env.SUPERMEMORY_API_KEY;
}

function getHeaders() {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("SUPERMEMORY_API_KEY is not configured");
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function parseError(response: Response) {
  const text = await response.text();
  return text || `${response.status} ${response.statusText}`;
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function getBrandReferenceContainerTag(voiceId: string) {
  return `brand_voice:${voiceId}`;
}

export function buildBrandReferenceMemoryContent(
  payload: BrandReferenceMemoryPayload
) {
  const note = payload.note?.trim();
  const applicableTo = payload.applicableTo.join(", ");

  return [
    "Brand voice reference for social content generation.",
    "Study this sample for tone, vocabulary, sentence length, openings, closings, casing, rhythm, structure, and how technical details are framed.",
    "Do not copy it. Use it only as a style reference.",
    `Reference type: ${payload.type}`,
    `Applicable platforms: ${applicableTo}`,
    note ? `When to use: ${note}` : null,
    payload.sourceUrl ? `Source URL: ${payload.sourceUrl}` : null,
    payload.tweetId ? `Tweet ID: ${payload.tweetId}` : null,
    "Sample:",
    truncateText(payload.content.trim(), 9500),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildBrandReferenceMemoryPayload(input: {
  organizationId: string;
  voiceId: string;
  reference: {
    id: string;
    type: string;
    content: string;
    note: string | null;
    applicableTo: string[];
    metadata: unknown;
    sourceUrl: string | null;
  };
}) {
  const tweetId = isRecord(input.reference.metadata)
    ? input.reference.metadata.tweetId
    : null;
  return {
    organizationId: input.organizationId,
    voiceId: input.voiceId,
    referenceId: input.reference.id,
    type: input.reference.type,
    content: input.reference.content,
    note: input.reference.note,
    applicableTo: input.reference.applicableTo,
    tweetId: typeof tweetId === "string" ? tweetId : null,
    sourceUrl: input.reference.sourceUrl,
  } satisfies BrandReferenceMemoryPayload;
}

export function getBrandReferenceMemorySyncHash(
  payload: BrandReferenceMemoryPayload
) {
  return createHash("sha256")
    .update(buildBrandReferenceMemoryContent(payload))
    .digest("hex");
}

async function findBrandReferenceMemory(
  payload: BrandReferenceMemoryPayload,
  syncHash: string
): Promise<BrandReferenceMemoryLink | null> {
  const response = await fetch(`${SUPERMEMORY_BASE_URL}/v4/search`, {
    method: "POST",
    headers: getHeaders(),
    signal: AbortSignal.timeout(SUPERMEMORY_REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      q: buildBrandReferenceMemoryContent(payload),
      limit: 1,
      threshold: 0.2,
      rerank: false,
      containerTag: getBrandReferenceContainerTag(payload.voiceId),
      include: { chunks: true },
      filters: {
        AND: [
          { key: "source", value: "brand_reference" },
          { key: "referenceId", value: payload.referenceId },
          { key: "syncHash", value: syncHash },
        ],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to find existing Supermemory reference memory: ${await parseError(response)}`
    );
  }

  const data: unknown = await response.json();
  if (!(isRecord(data) && Array.isArray(data.results))) {
    return null;
  }

  const result = data.results.find((candidate) => {
    if (!isRecord(candidate) || !isRecord(candidate.metadata)) {
      return false;
    }
    return (
      candidate.metadata.referenceId === payload.referenceId &&
      candidate.metadata.syncHash === syncHash
    );
  });
  if (!isRecord(result)) {
    return null;
  }

  const chunks = Array.isArray(result.chunks) ? result.chunks : [];
  const documentChunk = chunks.find(
    (chunk) => isRecord(chunk) && typeof chunk.documentId === "string"
  );
  let documentId: string | null = null;
  if (typeof result.documentId === "string") {
    documentId = result.documentId;
  } else if (
    isRecord(documentChunk) &&
    typeof documentChunk.documentId === "string"
  ) {
    documentId = documentChunk.documentId;
  }
  const memoryId = typeof result.id === "string" ? result.id : null;
  return documentId || memoryId ? { documentId, memoryId } : null;
}

export async function createBrandReferenceMemory(
  payload: BrandReferenceMemoryPayload
): Promise<BrandReferenceMemoryLink> {
  const syncHash = getBrandReferenceMemorySyncHash(payload);
  const existing = await findBrandReferenceMemory(payload, syncHash);
  if (existing) {
    return existing;
  }

  const response = await fetch(`${SUPERMEMORY_BASE_URL}/v4/memories`, {
    method: "POST",
    headers: getHeaders(),
    signal: AbortSignal.timeout(SUPERMEMORY_REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      containerTag: getBrandReferenceContainerTag(payload.voiceId),
      memories: [
        {
          content: buildBrandReferenceMemoryContent(payload),
          metadata: {
            source: "brand_reference",
            organizationId: payload.organizationId,
            voiceId: payload.voiceId,
            referenceId: payload.referenceId,
            syncHash,
            type: payload.type,
            applicableTo: payload.applicableTo,
            tweetId: payload.tweetId ?? undefined,
            url: payload.sourceUrl ?? undefined,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create Supermemory reference memory: ${await parseError(response)}`
    );
  }

  const data: unknown = await response.json();
  if (!isRecord(data)) {
    throw new Error(
      "Supermemory returned an invalid reference memory response"
    );
  }

  const documentId =
    typeof data.documentId === "string" ? data.documentId : null;
  const firstMemory = Array.isArray(data.memories) ? data.memories[0] : null;
  const memoryId =
    isRecord(firstMemory) && typeof firstMemory.id === "string"
      ? firstMemory.id
      : null;

  return {
    documentId,
    memoryId,
  };
}

export async function deleteBrandReferenceMemory(input: {
  documentId?: string | null;
}) {
  if (!input.documentId) {
    return;
  }

  const response = await fetch(
    `${SUPERMEMORY_BASE_URL}/v3/documents/${encodeURIComponent(input.documentId)}`,
    {
      method: "DELETE",
      headers: getHeaders(),
      signal: AbortSignal.timeout(SUPERMEMORY_REQUEST_TIMEOUT_MS),
    }
  );

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to delete Supermemory reference memory: ${await parseError(response)}`
    );
  }
}

export async function searchBrandReferenceMemories(input: {
  voiceId: string;
  query: string;
  applicableTo?: string;
  limit?: number;
}) {
  const response = await fetch(`${SUPERMEMORY_BASE_URL}/v4/search`, {
    method: "POST",
    headers: getHeaders(),
    signal: AbortSignal.timeout(SUPERMEMORY_REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      q: input.query,
      limit: input.limit ?? 6,
      threshold: 0.2,
      rerank: true,
      containerTag: getBrandReferenceContainerTag(input.voiceId),
      filters: {
        AND: [
          { key: "source", value: "brand_reference" },
          { key: "voiceId", value: input.voiceId },
          ...(input.applicableTo
            ? [
                {
                  OR: [
                    {
                      filterType: "array_contains",
                      key: "applicableTo",
                      value: "all",
                    },
                    {
                      filterType: "array_contains",
                      key: "applicableTo",
                      value: input.applicableTo,
                    },
                  ],
                },
              ]
            : []),
        ],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to search Supermemory brand references: ${await parseError(response)}`
    );
  }

  const data = (await response.json()) as {
    results?: SupermemorySearchResult[];
  };

  return data.results ?? [];
}

export function getBrandReferenceIdFromSearchResult(
  result: SupermemorySearchResult
) {
  const referenceId = result.metadata?.referenceId;
  return typeof referenceId === "string" ? referenceId : null;
}
