import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type {
  GitHubPublishFailureRedis,
  GitHubPublishOutputTarget,
} from "@/types/integrations/github";
import {
  clearGitHubPublishFailures,
  recordGitHubPublishFailure,
} from "./github-publish-failure-state";

function createRedisClient(options?: {
  del?: (key: string) => Promise<number>;
  increment?: (key: string) => Promise<number>;
}): GitHubPublishFailureRedis {
  return {
    del: options?.del ?? (async () => 1),
    eval: async <TArgs extends unknown[], TData = unknown>(
      _script: string,
      keys: string[],
      _args: TArgs
    ) =>
      (await (options?.increment ?? (async () => 0))(keys[0] ?? "")) as TData,
  };
}

describe("GitHub publish failure auto-pause", () => {
  test("pauses only the selected repository output after three failures", async () => {
    const values = new Map<string, number>();
    const deletedKeys: string[] = [];
    const pauseCalls: GitHubPublishOutputTarget[] = [];
    const redisClient = createRedisClient({
      increment: async (key: string) => {
        const nextValue = (values.get(key) ?? 0) + 1;
        values.set(key, nextValue);
        return nextValue;
      },
      del: async (key: string) => {
        deletedKeys.push(key);
        values.delete(key);
        return 1;
      },
    });
    const params = {
      organizationId: "organization-1",
      outputId: "output-1",
      outputType: "changelog" as const,
      repositoryId: "repository-1",
    };
    const dependencies = {
      redisClient,
      pauseOutput: async (target: GitHubPublishOutputTarget) => {
        pauseCalls.push(target);
        return true;
      },
    };

    assert.deepEqual(await recordGitHubPublishFailure(params, dependencies), {
      failureCount: 1,
      paused: false,
    });
    assert.deepEqual(await recordGitHubPublishFailure(params, dependencies), {
      failureCount: 2,
      paused: false,
    });
    assert.deepEqual(await recordGitHubPublishFailure(params, dependencies), {
      failureCount: 3,
      paused: true,
    });
    assert.deepEqual(pauseCalls, [
      {
        outputId: "output-1",
        outputType: "changelog",
        repositoryId: "repository-1",
      },
    ]);
    assert.deepEqual(deletedKeys, [
      "github:content-publish:organization-1:repository-1:changelog:failures",
    ]);
  });

  test("success clears only the organization and repository failure key", async () => {
    const deletedKeys: string[] = [];

    await clearGitHubPublishFailures(
      {
        organizationId: "organization-2",
        outputType: "blog_post",
        repositoryId: "repository-4",
      },
      {
        redisClient: createRedisClient({
          del: async (key: string) => {
            deletedKeys.push(key);
            return 1;
          },
        }),
      }
    );

    assert.deepEqual(deletedKeys, [
      "github:content-publish:organization-2:repository-4:blog_post:failures",
    ]);
  });

  test("does not block recovery when clearing Redis fails", async () => {
    const originalWarn = console.warn;
    console.warn = () => undefined;

    try {
      await assert.doesNotReject(() =>
        clearGitHubPublishFailures(
          {
            organizationId: "organization-2",
            outputType: "changelog",
            repositoryId: "repository-4",
          },
          {
            redisClient: createRedisClient({
              del: async () => {
                throw new Error("Redis unavailable");
              },
            }),
          }
        )
      );
    } finally {
      console.warn = originalWarn;
    }
  });

  test("does not pause when the atomic counter update fails", async () => {
    const deletedKeys: string[] = [];

    await assert.rejects(() =>
      recordGitHubPublishFailure(
        {
          organizationId: "organization-1",
          outputId: "output-1",
          outputType: "changelog",
          repositoryId: "repository-1",
        },
        {
          redisClient: createRedisClient({
            increment: async () => {
              throw new Error("Redis unavailable");
            },
            del: async (key: string) => {
              deletedKeys.push(key);
              return 1;
            },
          }),
        }
      )
    );

    assert.deepEqual(deletedKeys, []);
  });

  test("reports a successful pause when counter cleanup fails", async () => {
    const originalWarn = console.warn;
    console.warn = () => undefined;

    try {
      assert.deepEqual(
        await recordGitHubPublishFailure(
          {
            organizationId: "organization-1",
            outputId: "output-1",
            outputType: "changelog",
            repositoryId: "repository-1",
          },
          {
            pauseOutput: async () => true,
            redisClient: createRedisClient({
              increment: async () => 3,
              del: async () => {
                throw new Error("Redis unavailable");
              },
            }),
          }
        ),
        { failureCount: 3, paused: true }
      );
    } finally {
      console.warn = originalWarn;
    }
  });

  test("does nothing when Redis is unavailable", async () => {
    assert.deepEqual(
      await recordGitHubPublishFailure(
        {
          organizationId: "organization-1",
          outputId: "output-1",
          outputType: "blog_post",
          repositoryId: "repository-1",
        },
        { redisClient: null }
      ),
      { failureCount: 0, paused: false }
    );
  });

  test("keeps blog post failures separate from changelog failures", async () => {
    const incrementedKeys: string[] = [];
    const redisClient = createRedisClient({
      increment: async (key: string) => {
        incrementedKeys.push(key);
        return 1;
      },
    });

    for (const outputType of ["changelog", "blog_post"] as const) {
      await recordGitHubPublishFailure(
        {
          organizationId: "organization-1",
          outputId: `${outputType}-output`,
          outputType,
          repositoryId: "repository-1",
        },
        { redisClient }
      );
    }

    assert.deepEqual(incrementedKeys, [
      "github:content-publish:organization-1:repository-1:changelog:failures",
      "github:content-publish:organization-1:repository-1:blog_post:failures",
    ]);
  });
});
