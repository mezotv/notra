export function hasMorePaginatedResults(
  response: unknown,
  pageSize: number
): boolean {
  if (typeof response !== "object" || response === null) {
    return false;
  }

  if ("hasMore" in response && typeof response.hasMore === "boolean") {
    return response.hasMore;
  }

  if ("list" in response && Array.isArray(response.list)) {
    return response.list.length >= pageSize;
  }

  return false;
}
