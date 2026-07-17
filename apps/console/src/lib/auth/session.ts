import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth/server";
import type { GetServerSessionParams } from "@/types/auth";

export async function getServerSession({ headers }: GetServerSessionParams) {
  const data = await auth.api.getSession({ headers }).catch((error) => {
    console.error("Error getting server session", error);
    return null;
  });

  return {
    session: data?.session ?? null,
    user: data?.user ?? null,
  };
}

export const getRequestSession = cache(async () =>
  getServerSession({ headers: await headers() })
);
