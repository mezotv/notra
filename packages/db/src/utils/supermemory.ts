import type {
  BrandReferenceMemoryLink,
  BrandReferenceMemoryPayload,
  SupermemorySearchResult,
} from "../types/supermemory";

const SUPERMEMORY_BASE_URL = "https://api.supermemory.ai";

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
    payload.url ? `Source URL: ${payload.url}` : null,
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
    metadata: Record<string, unknown> | null;
  };
}) {
  const tweetId = input.reference.metadata?.tweetId;
  const url = input.reference.metadata?.url;

  return {
    organizationId: input.organizationId,
    voiceId: input.voiceId,
    referenceId: input.reference.id,
    type: input.reference.type,
    content: input.reference.content,
    note: input.reference.note,
    applicableTo: input.reference.applicableTo,
    tweetId: typeof tweetId === "string" ? tweetId : null,
    url: typeof url === "string" ? url : null,
  } satisfies BrandReferenceMemoryPayload;
}

export async function createBrandReferenceMemory(
  payload: BrandReferenceMemoryPayload
): Promise<BrandReferenceMemoryLink> {
  const response = await fetch(`${SUPERMEMORY_BASE_URL}/v4/memories`, {
    method: "POST",
    headers: getHeaders(),
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
            type: payload.type,
            applicableTo: payload.applicableTo,
            tweetId: payload.tweetId ?? undefined,
            url: payload.url ?? undefined,
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

  const data = (await response.json()) as {
    documentId?: string | null;
    memories?: Array<{ id?: string }>;
  };

  return {
    documentId: data.documentId ?? null,
    memoryId: data.memories?.[0]?.id ?? null,
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
