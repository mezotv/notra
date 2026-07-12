import { auth } from "@/lib/auth/server";

export async function getServerSession({ headers }: { headers: Headers }) {
  const data = await auth.api.getSession({ headers }).catch((error) => {
    console.error("Error getting server session", error);
    return null;
  });

  return {
    session: data?.session ?? null,
    user: data?.user ?? null,
  };
}
