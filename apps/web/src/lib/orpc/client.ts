import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { WebRouter } from "./router";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
}

const link = new RPCLink({
  url: `${getBaseUrl()}/rpc`,
});

export const webOrpcClient: RouterClient<WebRouter> = createORPCClient(link);
