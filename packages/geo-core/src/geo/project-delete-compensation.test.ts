import { describe, expect, test } from "bun:test";

import { Effect } from "effect";

import { GeoDatabaseError, GeoProjectDeleteBlockedError } from "./errors";
import { runProjectDeleteAfterCancellation } from "./project-delete-compensation";

describe("runProjectDeleteAfterCancellation", () => {
  test("repairs a transaction failure exactly once and preserves it", async () => {
    const original = new GeoDatabaseError({
      label: "project delete failed",
      cause: new Error("transaction rolled back"),
    });
    let repairs = 0;

    const failure = await Effect.runPromise(
      runProjectDeleteAfterCancellation(
        "project-1",
        Effect.fail(original),
        Effect.sync(() => {
          repairs += 1;
        })
      ).pipe(Effect.flip)
    );

    expect(failure).toBe(original);
    expect(repairs).toBe(1);
  });

  test("repairs a delete refused by the locked recount exactly once", async () => {
    let repairs = 0;

    const failure = await Effect.runPromise(
      runProjectDeleteAfterCancellation(
        "project-1",
        Effect.succeed("last_project"),
        Effect.sync(() => {
          repairs += 1;
        })
      ).pipe(Effect.flip)
    );

    expect(failure._tag).toBe("GeoProjectDeleteBlockedError");
    expect(failure.projectId).toBe("project-1");
    expect(failure.reason).toBe("last_project");
    expect(repairs).toBe(1);
  });

  test("does not repair a successful delete", async () => {
    let repairs = 0;

    const outcome = await Effect.runPromise(
      runProjectDeleteAfterCancellation(
        "project-1",
        Effect.succeed("deleted"),
        Effect.sync(() => {
          repairs += 1;
        })
      )
    );

    expect(outcome).toBe("deleted");
    expect(repairs).toBe(0);
  });

  test("does not repair a project another delete already removed", async () => {
    let repairs = 0;

    const outcome = await Effect.runPromise(
      runProjectDeleteAfterCancellation(
        "project-1",
        Effect.succeed("not_found"),
        Effect.sync(() => {
          repairs += 1;
        })
      )
    );

    expect(outcome).toBe("not_found");
    expect(repairs).toBe(0);
  });

  test("returns a changed schedule for a fresh cancellation attempt", async () => {
    let repairs = 0;

    const outcome = await Effect.runPromise(
      runProjectDeleteAfterCancellation(
        "project-1",
        Effect.succeed("schedule_changed"),
        Effect.sync(() => {
          repairs += 1;
        })
      )
    );

    expect(outcome).toBe("schedule_changed");
    expect(repairs).toBe(0);
  });

  test("does not let a repair failure replace the delete failure", async () => {
    const original = new GeoDatabaseError({
      label: "project delete failed",
      cause: new Error("transaction rolled back"),
    });

    const failure = await Effect.runPromise(
      runProjectDeleteAfterCancellation(
        "project-1",
        Effect.fail(original),
        Effect.fail(new Error("repair failed"))
      ).pipe(Effect.flip)
    );

    expect(failure).toBe(original);
  });

  test("does not let a repair defect replace the delete failure", async () => {
    const original = new GeoProjectDeleteBlockedError({
      projectId: "project-1",
      reason: "last_project",
    });

    const failure = await Effect.runPromise(
      runProjectDeleteAfterCancellation(
        "project-1",
        Effect.fail(original),
        Effect.die("repair crashed")
      ).pipe(Effect.flip)
    );

    expect(failure).toBe(original);
  });
});
