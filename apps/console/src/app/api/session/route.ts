import { getAuthSession } from "@/lib/auth/server";
import type { ClientSessionData } from "@/types/auth";

export async function GET() {
  const data = await getAuthSession();

  if (!data) {
    return Response.json(null, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const payload: ClientSessionData = {
    session: data.session,
    user: {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      emailVerified: data.user.emailVerified,
      image: data.user.image,
      role: data.user.role,
      hidePersonalData: data.user.hidePersonalData,
      showAgentStats: data.user.showAgentStats,
      createdAt: data.user.createdAt,
    },
  };

  return Response.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
