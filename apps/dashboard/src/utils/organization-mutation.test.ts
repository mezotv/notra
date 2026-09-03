import { describe, expect, test } from "bun:test";

import { createOrganizationMutationQueue } from "./organization-mutation";

describe("serializeOrganizationMutation", () => {
  test("runs overlapping mutations in invocation order", async () => {
    const serializeOrganizationMutation = createOrganizationMutationQueue();
    const order: string[] = [];
    let releaseFirst = () => undefined;
    const firstBlocker = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = serializeOrganizationMutation(async () => {
      order.push("first:start");
      await firstBlocker;
      order.push("first:end");
    });
    const second = serializeOrganizationMutation(async () => {
      order.push("second:start");
      order.push("second:end");
    });

    await Promise.resolve();
    expect(order).toEqual(["first:start"]);

    releaseFirst();
    await Promise.all([first, second]);
    expect(order).toEqual([
      "first:start",
      "first:end",
      "second:start",
      "second:end",
    ]);
  });

  test("continues the queue after a rejected mutation", async () => {
    const serializeOrganizationMutation = createOrganizationMutationQueue();
    const failure = serializeOrganizationMutation(() =>
      Promise.reject(new Error("failed mutation"))
    );
    const recovery = serializeOrganizationMutation(() =>
      Promise.resolve("recovered")
    );

    await expect(failure).rejects.toThrow("failed mutation");
    await expect(recovery).resolves.toBe("recovered");
  });

  test("does not overlap a later mutation with an in-flight mutation", async () => {
    const serializeOrganizationMutation = createOrganizationMutationQueue();
    let releaseFirst = () => undefined;
    const firstBlocker = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let secondStarted = false;

    const first = serializeOrganizationMutation(() => firstBlocker);
    const second = serializeOrganizationMutation(async () => {
      secondStarted = true;
    });

    await Bun.sleep(5);
    expect(secondStarted).toBe(false);

    releaseFirst();
    await Promise.all([first, second]);
    expect(secondStarted).toBe(true);
  });

  test("skips a stale queued intent while preserving the latest intent", async () => {
    const serializeOrganizationMutation = createOrganizationMutationQueue();
    const order: string[] = [];
    let currentIntent = 1;
    let releaseInFlight = () => undefined;
    const inFlightBlocker = new Promise<void>((resolve) => {
      releaseInFlight = resolve;
    });

    const inFlight = serializeOrganizationMutation(async () => {
      order.push("b:start");
      await inFlightBlocker;
      order.push("b:end");
    });
    const staleIntent = currentIntent;
    const stale = serializeOrganizationMutation(async () => {
      if (currentIntent === staleIntent) {
        order.push("stale:start");
      }
    });

    currentIntent = 2;
    const latestIntent = currentIntent;
    const latest = serializeOrganizationMutation(async () => {
      if (currentIntent === latestIntent) {
        order.push("a:start");
      }
    });

    await Promise.resolve();
    expect(order).toEqual(["b:start"]);

    releaseInFlight();
    await Promise.all([inFlight, stale, latest]);
    expect(order).toEqual(["b:start", "b:end", "a:start"]);
  });
});
