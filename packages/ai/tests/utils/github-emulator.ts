import { once } from "node:events";
import { createServer } from "node:net";

import { createEmulator } from "emulate";

export async function startGithubEmulator() {
  // Emulate 0.10 reports :0 instead of the allocated port, so choose a free
  // local port first. Never inherit EMULATE_BASE_URL or PORTLESS_URL from dev.
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const address = probe.address();
  probe.close();
  await once(probe, "close");
  if (!address || typeof address === "string") {
    throw new Error("Could not allocate a local emulator port");
  }
  const { port } = address;
  return createEmulator({
    service: "github",
    port,
    baseUrl: `http://127.0.0.1:${port}`,
    seed: {
      tokens: {
        notra_test_token: { login: "notra-test", scopes: ["repo", "user"] },
      },
      github: {
        users: [{ login: "notra-test", name: "Notra Test" }],
        repos: [{ owner: "notra-test", name: "product", auto_init: true }],
      },
    },
  });
}
