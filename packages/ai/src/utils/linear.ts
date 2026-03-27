import { LinearClient } from "@linear/sdk";

export function createLinearClient(accessToken: string): LinearClient {
  return new LinearClient({ accessToken });
}
