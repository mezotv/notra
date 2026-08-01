import { LeaseError } from "@notra/ai/autonomy/errors";
import { MILLISECONDS_PER_SECOND } from "@notra/ai/constants/autonomy";
import type {
  AcquireControllerLeaseInput,
  ControllerLeaseResult,
  ReleaseControllerLeaseInput,
  RenewControllerLeaseInput,
} from "@notra/ai/types/autonomy";
import { db } from "@notra/db/drizzle";
import { autonomyControllerLeases } from "@notra/db/schema";
import { and, eq, gt, lt, or, sql } from "drizzle-orm";
import { Effect } from "effect";

const INITIAL_FENCING_TOKEN = 1;

const expiryFrom = (now: Date, ttlSeconds: number): Date =>
  new Date(now.getTime() + ttlSeconds * MILLISECONDS_PER_SECOND);

export const acquireControllerLease = Effect.fn("iris.lease.acquire")(
  function* (input: AcquireControllerLeaseInput) {
    const now = new Date();
    const expiresAt = expiryFrom(now, input.ttlSeconds);

    const rows = yield* Effect.tryPromise({
      try: () =>
        db
          .insert(autonomyControllerLeases)
          .values({
            id: input.leaseName,
            organizationId: input.organizationId,
            ownerToken: input.ownerToken,
            fencingToken: INITIAL_FENCING_TOKEN,
            expiresAt,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: autonomyControllerLeases.id,
            set: {
              organizationId: input.organizationId,
              ownerToken: input.ownerToken,
              fencingToken: sql`${autonomyControllerLeases.fencingToken} + 1`,
              expiresAt,
              updatedAt: now,
            },
            setWhere: or(
              lt(autonomyControllerLeases.expiresAt, now),
              eq(autonomyControllerLeases.ownerToken, input.ownerToken)
            ),
          })
          .returning({
            fencingToken: autonomyControllerLeases.fencingToken,
          }),
      catch: (cause) =>
        new LeaseError({
          message: "Failed to acquire controller lease",
          cause,
        }),
    });

    const fencingToken = rows.at(0)?.fencingToken ?? null;
    const acquired = fencingToken !== null;

    yield* Effect.annotateLogs(
      acquired
        ? Effect.logInfo("iris.lease.acquired")
        : Effect.logWarning("iris.lease.denied"),
      {
        organizationId: input.organizationId,
        leaseName: input.leaseName,
        fencingToken,
      }
    );

    return { acquired, fencingToken } satisfies ControllerLeaseResult;
  }
);

export const renewControllerLease = Effect.fn("iris.lease.renew")(function* (
  input: RenewControllerLeaseInput
) {
  const now = new Date();
  const expiresAt = expiryFrom(now, input.ttlSeconds);

  const rows = yield* Effect.tryPromise({
    try: () =>
      db
        .update(autonomyControllerLeases)
        .set({ expiresAt, updatedAt: now })
        .where(
          and(
            eq(autonomyControllerLeases.id, input.leaseName),
            eq(autonomyControllerLeases.ownerToken, input.ownerToken),
            gt(autonomyControllerLeases.expiresAt, now)
          )
        )
        .returning({ id: autonomyControllerLeases.id }),
    catch: (cause) =>
      new LeaseError({ message: "Failed to renew controller lease", cause }),
  });

  const renewed = rows.length > 0;

  if (!renewed) {
    yield* Effect.annotateLogs(Effect.logWarning("iris.lease.renewFailed"), {
      leaseName: input.leaseName,
    });
  }

  return renewed;
});

export const releaseControllerLease = Effect.fn("iris.lease.release")(
  function* (input: ReleaseControllerLeaseInput) {
    yield* Effect.tryPromise({
      try: () =>
        db
          .delete(autonomyControllerLeases)
          .where(
            and(
              eq(autonomyControllerLeases.id, input.leaseName),
              eq(autonomyControllerLeases.ownerToken, input.ownerToken)
            )
          ),
      catch: (cause) =>
        new LeaseError({
          message: "Failed to release controller lease",
          cause,
        }),
    });

    yield* Effect.annotateLogs(Effect.logDebug("iris.lease.released"), {
      leaseName: input.leaseName,
    });
  }
);
