import { IRIS_MANDATE_NAME } from "@notra/ai/constants/autonomy";
import { mandateSchema } from "@notra/ai/schemas/autonomy/mandate";
import { db } from "@notra/db/drizzle";
import { autonomyMandates, organizations } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { IrisMandateLoadError } from "@/lib/iris/errors";
import type { IrisMandateContext } from "@/types/iris";

export const loadActiveMandateRow = Effect.fn("iris.mandate.loadActive")(
  function* (organizationId: string) {
    const rows = yield* Effect.tryPromise({
      try: () =>
        db
          .select()
          .from(autonomyMandates)
          .where(
            and(
              eq(autonomyMandates.organizationId, organizationId),
              eq(autonomyMandates.name, IRIS_MANDATE_NAME),
              eq(autonomyMandates.status, "active")
            )
          )
          .limit(1),
      catch: (cause) =>
        new IrisMandateLoadError({
          message: "Failed to load the active mission",
          cause,
        }),
    });

    return rows.at(0) ?? null;
  }
);

export const loadIrisMandateContext = Effect.fn("iris.mandate.loadContext")(
  function* (organizationId: string) {
    const [row, organizationRows] = yield* Effect.all([
      loadActiveMandateRow(organizationId),
      Effect.tryPromise({
        try: () =>
          db
            .select({ name: organizations.name, slug: organizations.slug })
            .from(organizations)
            .where(eq(organizations.id, organizationId))
            .limit(1),
        catch: (cause) =>
          new IrisMandateLoadError({
            message: "Failed to load the organization",
            cause,
          }),
      }),
    ]);

    const organization = organizationRows.at(0) ?? null;
    const context: IrisMandateContext = {
      mandate: null,
      organizationName: organization?.name ?? null,
      organizationSlug: organization?.slug ?? null,
    };

    if (row === null) {
      return context;
    }

    const parsed = mandateSchema.safeParse({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      objective: row.objective,
      policy: row.policy,
      status: row.status,
      version: row.version,
    });

    if (!parsed.success) {
      return yield* Effect.fail(
        new IrisMandateLoadError({
          message: "The stored mission is not valid",
          cause: parsed.error.issues,
        })
      );
    }

    yield* Effect.annotateLogs(Effect.logDebug("iris.mandate.loaded"), {
      organizationId,
      mandateId: parsed.data.id,
      mandateVersion: parsed.data.version,
    });

    return { ...context, mandate: parsed.data };
  }
);
