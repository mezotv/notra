import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import type { RouterClient } from "@orpc/server";
import type { ConsoleRouter } from "./router";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.CONSOLE_BETTER_AUTH_URL ?? "http://localhost:3003";
}

const link = new RPCLink({
  url: `${getBaseUrl()}/rpc`,
  plugins: [new SimpleCsrfProtectionLinkPlugin()],
});

export const consoleOrpcClient: RouterClient<ConsoleRouter> =
  createORPCClient(link);
