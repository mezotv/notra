import type { getServerSession } from "@/lib/auth/session";

type SessionData = Awaited<ReturnType<typeof getServerSession>>;

export interface ORPCContext {
  headers: Headers;
  session: SessionData["session"] | null;
  user: SessionData["user"] | null;
}

export async function createORPCContext({
  headers,
}: {
  headers: Headers;
}): Promise<ORPCContext> {
  return {
    headers,
    session: null,
    user: null,
  };
}
