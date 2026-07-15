import { ORPCError } from "@orpc/server";
import { assertAuthenticated } from "@/lib/auth/organization";

export async function assertAdmin({ headers }: { headers: Headers }) {
  const { user } = await assertAuthenticated({ headers });

  if (user.role !== "admin") {
    throw new ORPCError("FORBIDDEN", {
      message: "You do not have access to integration reviews",
    });
  }

  return { user };
}
