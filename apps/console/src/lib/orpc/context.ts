export interface ORPCContext {
  headers: Headers;
}

export function createORPCContext({
  headers,
}: {
  headers: Headers;
}): ORPCContext {
  return {
    headers,
  };
}
