import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { DashboardRouter } from "./router";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  );
}

const link = new RPCLink({
  url: `${getBaseUrl()}/rpc`,
});

export const dashboardOrpcClient: RouterClient<DashboardRouter> =
  createORPCClient(link);

export type DashboardORPCClient = RouterClient<DashboardRouter>;
