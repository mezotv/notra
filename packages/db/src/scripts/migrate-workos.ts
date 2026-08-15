import { WorkOS } from "@workos-inc/node";
import { eq, isNull, sql } from "drizzle-orm";
import { Data, Effect } from "effect";
import { db } from "../drizzle";
import { members, organizations, users } from "../schema";

class WorkOSMigrationError extends Data.TaggedError("WorkOSMigrationError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

const SCRYPT_LOG_N = 14;
const SCRYPT_R = 16;
const SCRYPT_P = 1;
const NAME_SPLIT_REGEX = /\s+/;
const BASE64_PADDING_REGEX = /=+$/;

const workosApiKey = process.env.WORKOS_API_KEY;
if (!workosApiKey) {
  throw new Error("WORKOS_API_KEY must be defined");
}

const workos = new WorkOS(workosApiKey);

function toPhcBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64").replace(BASE64_PADDING_REGEX, "");
}

function betterAuthHashToPhc(hash: string) {
  const [saltHex, keyHex] = hash.split(":");

  if (!(saltHex && keyHex)) {
    return null;
  }

  const salt = toPhcBase64(new TextEncoder().encode(saltHex));
  const key = toPhcBase64(Buffer.from(keyHex, "hex"));

  return `$scrypt$ln=${SCRYPT_LOG_N},r=${SCRYPT_R},p=${SCRYPT_P}$${salt}$${key}`;
}

function splitName(name: string) {
  const [firstName, ...rest] = name.trim().split(NAME_SPLIT_REGEX);
  return {
    firstName: firstName || undefined,
    lastName: rest.join(" ") || undefined,
  };
}

const tryWorkOS = <T>(run: () => Promise<T>, message: string) =>
  Effect.tryPromise({
    try: run,
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
      yield* Effect.logWarning(
        "accounts table not found - password hashes cannot be imported. Run this script BEFORE applying migration 0064."
      );
      return new Map<string, string>();
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

  yield* Effect.logInfo(`Migrating ${pending.length} organizations`);

  for (const organization of pending) {
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
  }
});

const migrateUsers = Effect.fn("migrate.users")(function* () {
  const hashes = yield* loadPasswordHashes();
  const pending = yield* tryWorkOS(
    () => db.query.users.findMany({ where: isNull(users.workosUserId) }),
    "Failed to load users"
  );

  yield* Effect.logInfo(`Migrating ${pending.length} users`);

  for (const user of pending) {
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
      } catch {
        const existing = await workos.userManagement.listUsers({
          email: user.email.toLowerCase(),
        });
        const match = existing.data[0];
        if (!match) {
          throw new Error(`No WorkOS user found for ${user.email}`);
        }
        await workos.userManagement.updateUser({
          userId: match.id,
          externalId: user.id,
        });
        return match.id;
      }
    }, `Failed to migrate user ${user.id}`);

    yield* tryWorkOS(
      () => db.update(users).set({ workosUserId }).where(eq(users.id, user.id)),
      `Failed to store workos id for user ${user.id}`
    );
  }
});

const migrateMemberships = Effect.fn("migrate.memberships")(function* () {
  const rows = yield* tryWorkOS(
    () =>
      db
        .select({
          memberId: members.id,
          workosOrgId: organizations.workosOrgId,
          workosUserId: users.workosUserId,
        })
        .from(members)
        .innerJoin(organizations, eq(members.organizationId, organizations.id))
        .innerJoin(users, eq(members.userId, users.id)),
    "Failed to load memberships"
  );

  yield* Effect.logInfo(`Migrating ${rows.length} memberships`);

  for (const row of rows) {
    if (!(row.workosOrgId && row.workosUserId)) {
      yield* Effect.logWarning(
        `Skipping membership ${row.memberId} - missing WorkOS ids`
      );
      continue;
    }

    yield* tryWorkOS(async () => {
      try {
        await workos.userManagement.createOrganizationMembership({
          organizationId: row.workosOrgId ?? "",
          userId: row.workosUserId ?? "",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (!message.toLowerCase().includes("already")) {
          throw error;
        }
      }
    }, `Failed to migrate membership ${row.memberId}`).pipe(
      Effect.catch((error) =>
        Effect.logWarning(`Membership ${row.memberId}: ${error.message}`)
      )
    );
  }
});

const run = Effect.fn("migrate.workos")(function* () {
  yield* migrateOrganizations();
  yield* migrateUsers();
  yield* migrateMemberships();
  yield* Effect.logInfo("WorkOS migration complete");
});

Effect.runPromise(run()).catch((error) => {
  console.error(error);
  process.exit(1);
});
