import { unstable_rethrow } from "next/navigation";
import { cache } from "react";

import { getAuthSession } from "@/lib/auth/server";
import type { GetServerSessionParams } from "@/types/auth";

export async function getServerSession(_params?: GetServerSessionParams) {
  const data = await getAuthSession().catch((error) => {
    unstable_rethrow(error);
    console.error("Error getting server session", error);
    return null;
  });

  return {
    session: data?.session ?? null,
    user: data?.user ?? null,
  };
}

export const getRequestSession = cache(async () => getServerSession());
