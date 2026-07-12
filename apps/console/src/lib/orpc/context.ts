import type { getServerSession } from "@/lib/auth/session";

type SessionData = Awaited<ReturnType<typeof getServerSession>>;

export interface ORPCContext {
  headers: Headers;
  session: SessionData["session"];
  user: SessionData["user"];
}

export function createORPCContext({
  headers,
}: {
  headers: Headers;
}): ORPCContext {
  return {
    headers,
    session: null,
    user: null,
  };
}
