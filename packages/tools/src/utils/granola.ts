import { GRANOLA_API_BASE_URL } from "@notra/ai/constants/granola";

export async function granolaApiRequest(
  apiKey: string,
  path: string,
  searchParams: Record<string, string | undefined>
): Promise<unknown> {
  const url = new URL(`${GRANOLA_API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Granola API request failed with status ${response.status} for ${path}.`
    );
  }

  return response.json();
}
