import { Octokit } from "@octokit/core";

export function createOctokit(auth?: string) {
  return new Octokit({
    auth,
  });
}
