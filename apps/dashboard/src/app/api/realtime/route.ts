import { realtime } from "@notra/ai/realtime";
import { handle } from "@upstash/realtime";
import { getServerSession } from "@/lib/auth/session";

const handler = realtime
  ? handle({
      realtime,
      middleware: async ({ request }) => {
        const { session } = await getServerSession({
          headers: request.headers,
        });

        if (!session) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        return undefined;
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
