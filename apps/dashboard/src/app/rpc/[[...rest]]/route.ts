import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { createORPCContext } from "@/lib/orpc/context";
import { dashboardRouter } from "@/lib/orpc/router";

const handler = new RPCHandler(dashboardRouter, {
  interceptors: [
    onError((error) => {
      console.error("[oRPC]", error);
    }),
  ],
});

async function handle(request: Request) {
  const { matched, response } = await handler.handle(request, {
    context: await createORPCContext({
      headers: request.headers,
    }),
    prefix: "/rpc",
  });

  if (!matched || !response) {
    return new Response("Not Found", { status: 404 });
  }

  return response;
}

export const HEAD = handle;
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
