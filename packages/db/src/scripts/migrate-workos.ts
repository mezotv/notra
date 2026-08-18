import { WorkOS } from "@workos-inc/node";
import { eq, isNotNull, isNull, sql } from "drizzle-orm";
import { Data, Effect } from "effect";
import { db } from "../drizzle";
import { members, organizations, users } from "../schema";

class WorkOSMigrationError extends Data.TaggedError("WorkOSMigrationError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {
  describe() {
    const causeText =
      this.cause instanceof Error ? this.cause.message : String(this.cause);
    return `${this.message}: ${causeText}`;
  }
}

const SCRYPT_N = 16_384;
const SCRYPT_R = 16;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;
const NAME_SPLIT_REGEX = /\s+/;
const BASE64_PADDING_REGEX = /=+$/;

const workosApiKey = process.env.WORKOS_API_KEY;
if (!workosApiKey) {
  throw new Error("WORKOS_API_KEY must be defined");
}

const workos = new WorkOS(workosApiKey);

function toPhcBase64(bytes: Uint8Array) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(BASE64_PADDING_REGEX, "");
}

function betterAuthHashToPhc(hash: string) {
  const [saltHex, keyHex] = hash.split(":");

  if (!(saltHex && keyHex)) {
    return null;
  }

  const salt = toPhcBase64(new TextEncoder().encode(saltHex));
  const key = toPhcBase64(Buffer.from(keyHex, "hex"));

  return `$scrypt$v=1$n=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P},kl=${SCRYPT_KEY_LENGTH}$${salt}$${key}`;
}

function splitName(name: string) {
  const [firstName, ...rest] = name.trim().split(NAME_SPLIT_REGEX);
  return {
    firstName: firstName || undefined,
    lastName: rest.join(" ") || undefined,
  };
}

const RETRY_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 750;
const RATE_LIMIT_DELAY_MS = 15_000;

function isNonRetryable(error: unknown) {
  if (!(error && typeof error === "object" && "status" in error)) {
    return false;
  }
  return error.status === 400 || error.status === 422 || error.status === 404;
}

function isRateLimited(error: unknown) {
  if (!(error && typeof error === "object")) {
    return false;
  }
  const status = "status" in error ? error.status : undefined;
  const message = "message" in error ? String(error.message) : "";
  return status === 429 || message.toLowerCase().includes("rate limit");
}

function describeError(error: unknown): string {
  if (error && typeof error === "object") {
    if ("rawData" in error && error.rawData) {
      return JSON.stringify(error.rawData).slice(0, 200);
    }
    if ("message" in error) {
      return String(error.message);
    }
  }
  return String(error);
}

async function withRetries<T>(run: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (isNonRetryable(error)) {
        throw error;
      }
      if (attempt < RETRY_ATTEMPTS) {
        const delay = isRateLimited(error)
          ? RATE_LIMIT_DELAY_MS
          : RETRY_BASE_DELAY_MS * attempt;
        console.warn(
          `  transient failure (attempt ${attempt}, ${isRateLimited(error) ? "rate limited, " : ""}waiting ${delay}ms): ${describeError(error)}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

const tryWorkOS = <T>(run: () => Promise<T>, message: string) =>
  Effect.tryPromise({
    try: () => withRetries(run),
    catch: (cause) => new WorkOSMigrationError({ message, cause }),
  });

const loadPasswordHashes = Effect.fn("migrate.loadPasswordHashes")(
  function* () {
    const tableExists = yield* tryWorkOS(
      () =>
        db.execute(
          sql`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') AS present`
        ),
      "Failed to check accounts table"
    );

    const present = Boolean(tableExists.rows[0]?.present);

    if (!present) {
      if (process.env.SKIP_PASSWORD_IMPORT === "1") {
        yield* Effect.logWarning(
          "accounts table not found - continuing WITHOUT password import because SKIP_PASSWORD_IMPORT=1."
        );
        return new Map<string, string>();
      }

      return yield* Effect.fail(
        new WorkOSMigrationError({
          message:
            "accounts table not found - password hashes cannot be imported. Run this script BEFORE applying migration 0064, or set SKIP_PASSWORD_IMPORT=1 to continue without passwords.",
        })
      );
    }

    const result = yield* tryWorkOS(
      () =>
        db.execute(
          sql`SELECT user_id, password FROM accounts WHERE provider_id = 'credential' AND password IS NOT NULL`
        ),
      "Failed to load password hashes"
    );

    const hashes = new Map<string, string>();
    for (const row of result.rows) {
      if (typeof row.user_id === "string" && typeof row.password === "string") {
        hashes.set(row.user_id, row.password);
      }
    }

    return hashes;
  }
);

const migrateOrganizations = Effect.fn("migrate.organizations")(function* () {
  const pending = yield* tryWorkOS(
    () =>
      db.query.organizations.findMany({
        where: isNull(organizations.workosOrgId),
      }),
    "Failed to load organizations"
  );

  const totalOrgs = yield* tryWorkOS(
    () => db.$count(organizations),
    "Failed to count organizations"
  );

  yield* Effect.logInfo(
    `Organizations: ${totalOrgs - pending.length} already linked, ${pending.length} to migrate`
  );

  let orgIndex = 0;

  for (const organization of pending) {
    orgIndex += 1;
    const workosOrgId = yield* tryWorkOS(async () => {
      try {
        const created = await workos.organizations.createOrganization({
          name: organization.name,
          externalId: organization.id,
        });
        return created.id;
      } catch {
        const existing = await workos.organizations.getOrganizationByExternalId(
          organization.id
        );
        return existing.id;
      }
    }, `Failed to migrate organization ${organization.id}`);

    yield* tryWorkOS(
      () =>
        db
          .update(organizations)
          .set({ workosOrgId })
          .where(eq(organizations.id, organization.id)),
      `Failed to store workos id for organization ${organization.id}`
    );

    yield* Effect.logInfo(
      `  [${orgIndex}/${pending.length}] org linked: ${organization.slug} (${organization.id}) -> ${workosOrgId}`
    );
  }
});

const migrateUsers = Effect.fn("migrate.users")(function* () {
  const hashes = yield* loadPasswordHashes();
  const pending = yield* tryWorkOS(
    () => db.query.users.findMany({ where: isNull(users.workosUserId) }),
    "Failed to load users"
  );

  const totalUsers = yield* tryWorkOS(
    () => db.$count(users),
    "Failed to count users"
  );

  yield* Effect.logInfo(
    `Users: ${totalUsers - pending.length} already linked, ${pending.length} to migrate (${hashes.size} password hashes available)`
  );

  let failed = 0;
  let userIndex = 0;

  for (const user of pending) {
    userIndex += 1;
    const { firstName, lastName } = splitName(user.name);
    const rawHash = hashes.get(user.id);
    const passwordHash = rawHash ? betterAuthHashToPhc(rawHash) : null;

    const workosUserId = yield* tryWorkOS(async () => {
      try {
        const created = await workos.userManagement.createUser({
          email: user.email,
          emailVerified: user.emailVerified,
          firstName,
          lastName,
          externalId: user.id,
          ...(passwordHash ? { passwordHash, passwordHashType: "scrypt" } : {}),
        });
        return created.id;
      } catch (createError) {
        const existing = await workos.userManagement.listUsers({
          email: user.email.toLowerCase(),
        });
        const match = existing.data[0];
        if (!match) {
          const reason =
            createError instanceof Error
              ? createError.message
              : "user creation rejected";
          throw new Error(reason);
        }
        await workos.userManagement.updateUser({
          userId: match.id,
          externalId: user.id,
        });
        return match.id;
      }
    }, `Failed to migrate user ${user.id}`).pipe(
      Effect.catch((error) =>
        Effect.logWarning(
          `  [${userIndex}/${pending.length}] user FAILED ${user.email} (${user.id}): ${error.describe()}`
        ).pipe(Effect.as(null))
      )
    );

    if (!workosUserId) {
      failed += 1;
      continue;
    }

    yield* tryWorkOS(
      () => db.update(users).set({ workosUserId }).where(eq(users.id, user.id)),
      `Failed to store workos id for user ${user.id}`
    );

    yield* Effect.logInfo(
      `  [${userIndex}/${pending.length}] user linked: ${user.email} -> ${workosUserId}${passwordHash ? " (password imported)" : " (no password hash)"}`
    );
  }

  if (failed > 0) {
    yield* Effect.logWarning(
      `${failed} users could not be migrated (see FAILED lines above)`
    );
  }
});

const backfillPasswords = Effect.fn("migrate.backfillPasswords")(function* () {
  const hashes = yield* loadPasswordHashes();

  if (hashes.size === 0) {
    return;
  }

  const linked = yield* tryWorkOS(
    () =>
      db.query.users.findMany({
        where: isNotNull(users.workosUserId),
        columns: { id: true, email: true, workosUserId: true },
      }),
    "Failed to load linked users"
  );

  const candidates = linked.filter((user) => hashes.has(user.id));

  if (candidates.length === 0) {
    return;
  }

  yield* Effect.logInfo(
    `Backfilling password hashes for ${candidates.length} already-linked users`
  );

  for (const user of candidates) {
    const rawHash = hashes.get(user.id);
    const passwordHash = rawHash ? betterAuthHashToPhc(rawHash) : null;

    if (!(passwordHash && user.workosUserId)) {
      continue;
    }

    yield* tryWorkOS(
      () =>
        workos.userManagement.updateUser({
          userId: user.workosUserId ?? "",
          passwordHash,
          passwordHashType: "scrypt",
        }),
      `Failed to backfill password for ${user.id}`
    ).pipe(
      Effect.andThen(Effect.logInfo(`  password backfilled: ${user.email}`)),
      Effect.catch((error) =>
        Effect.logWarning(
          `  password backfill FAILED ${user.email}: ${error.describe()}`
        )
      )
    );
  }
});

const migrateMemberships = Effect.fn("migrate.memberships")(function* () {
  const rows = yield* tryWorkOS(
    () =>
      db
        .select({
          memberId: members.id,
          role: members.role,
          workosOrgId: organizations.workosOrgId,
          workosUserId: users.workosUserId,
        })
        .from(members)
        .innerJoin(organizations, eq(members.organizationId, organizations.id))
        .innerJoin(users, eq(members.userId, users.id)),
    "Failed to load memberships"
  );

  yield* Effect.logInfo(`Migrating ${rows.length} memberships`);

  let membershipIndex = 0;

  for (const row of rows) {
    membershipIndex += 1;
    if (!(row.workosOrgId && row.workosUserId)) {
      yield* Effect.logWarning(
        `Skipping membership ${row.memberId} - missing WorkOS ids`
      );
      continue;
    }

    const outcome = yield* tryWorkOS(async () => {
      try {
        await workos.userManagement.createOrganizationMembership({
          organizationId: row.workosOrgId ?? "",
          userId: row.workosUserId ?? "",
          roleSlug: row.role,
        });
        return "created";
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (!message.toLowerCase().includes("already")) {
          throw error;
        }

        const existing =
          await workos.userManagement.listOrganizationMemberships({
            organizationId: row.workosOrgId ?? "",
            userId: row.workosUserId ?? "",
          });
        const membership = existing.data[0];

        if (membership && membership.role.slug !== row.role) {
          await workos.userManagement.updateOrganizationMembership(
            membership.id,
            { roleSlug: row.role }
          );
          return `role corrected ${membership.role.slug} -> ${row.role}`;
        }

        return "already exists";
      }
    }, `Failed to migrate membership ${row.memberId}`).pipe(
      Effect.catch((error) =>
        Effect.logWarning(
          `  [${membershipIndex}/${rows.length}] membership FAILED ${row.memberId} (role ${row.role}): ${error.describe()}`
        ).pipe(Effect.as("failed"))
      )
    );

    if (outcome !== "failed") {
      yield* Effect.logInfo(
        `  [${membershipIndex}/${rows.length}] membership ${outcome}: member ${row.memberId} role ${row.role}`
      );
    }
  }
});

const run = Effect.fn("migrate.workos")(function* () {
  yield* migrateOrganizations();
  yield* migrateUsers();
  yield* backfillPasswords();
  yield* migrateMemberships();
  yield* Effect.logInfo("WorkOS migration complete");
});

Effect.runPromise(run()).catch((error) => {
  console.error(error);
  process.exit(1);
});
