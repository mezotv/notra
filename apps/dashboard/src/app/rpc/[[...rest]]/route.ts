import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { trackServerException } from "@/lib/analytics/posthog-server";
import { createORPCContext } from "@/lib/orpc/context";
import { dashboardRouter } from "@/lib/orpc/router";
import { isServerFailureError } from "@/utils/orpc-errors";

const handler = new RPCHandler(dashboardRouter, {
  interceptors: [
    onError((error, options) => {
      console.error("[oRPC]", error);
      if (isServerFailureError(error)) {
        trackServerException({
          error,
          headers: options.context.headers,
          userId: options.context.user?.id,
          organizationId: options.context.session?.activeOrganizationId,
          properties: { surface: "rpc" },
        });
      }
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
