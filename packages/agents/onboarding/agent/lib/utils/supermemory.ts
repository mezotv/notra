import { SUPERMEMORY_BASE_URL } from "../constants/supermemory";

export function getSupermemoryHeaders() {
  const apiKey = process.env.SUPERMEMORY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("SUPERMEMORY_API_KEY is not configured");
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export function getOrganizationContainerTag(organizationId: string) {
  return organizationId;
}

export async function requestSupermemory(path: string, body: unknown) {
  const response = await fetch(`${SUPERMEMORY_BASE_URL}${path}`, {
    method: "POST",
    headers: getSupermemoryHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Supermemory request to ${path} failed: ${text || response.status}`
    );
  }

  return response.json();
}
