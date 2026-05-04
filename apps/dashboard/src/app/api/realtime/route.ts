import { realtime } from "@notra/ai/realtime";
import { handle } from "@upstash/realtime";
import { getServerSession } from "@/lib/auth/session";
import { authorizeRealtimeChannels } from "@/lib/realtime/channel-acl";

const handler = realtime
  ? handle({
      realtime,
      middleware: async ({ request, channels }) => {
        const { session, user } = await getServerSession({
          headers: request.headers,
        });

        if (!(session && user)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        return authorizeRealtimeChannels({
          headers: request.headers,
          channels,
          user,
        });
      },
    })
  : null;

export async function GET(request: Request) {
  if (!handler) {
    return new Response(JSON.stringify({ error: "Realtime not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  return handler(request);
}
