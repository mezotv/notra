import type { SupermemoryReferenceSearchResult } from "@notra/ai/types/supermemory";

const SUPERMEMORY_BASE_URL = "https://api.supermemory.ai";

function getApiKey() {
  return process.env.SUPERMEMORY_API_KEY;
}

async function parseError(response: Response) {
  const text = await response.text();
  return text || `${response.status} ${response.statusText}`;
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

export function getBrandReferenceContainerTag(voiceId: string) {
  return `brand_voice:${voiceId}`;
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
    results?: SupermemoryReferenceSearchResult[];
  };

  return data.results ?? [];
}

export function getBrandReferenceIdFromSearchResult(
  result: SupermemoryReferenceSearchResult
) {
  const referenceId = result.metadata?.referenceId;
  return typeof referenceId === "string" ? referenceId : null;
}
