import { db } from "@notra/db/drizzle";
import {
  members,
  personaReferences,
  personaSocials,
  personas,
} from "@notra/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Data, Effect } from "effect";
import { nanoid } from "nanoid";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { authorizedProcedure } from "@/lib/orpc/base";
import { organizationIdSchema } from "@/schemas/auth/organization";
import {
  createPersonaReferenceSchema,
  createPersonaSchema,
  personaIdSchema,
  setPersonaSocialsSchema,
  updatePersonaReferenceSchema,
  updatePersonaSchema,
} from "@/schemas/personas";
import type {
  PersonaReferenceRow,
  PersonaRow,
  PersonaSocialRow,
} from "@/types/orpc/personas";
import type {
  CreatePersonaInput,
  Persona,
  PersonaReference,
  PersonaSocial,
  PersonaSocialInput,
  UpdatePersonaInput,
  UpdatePersonaReferenceInput,
} from "@/types/personas";
import { conflict, internalServerError, notFound } from "../utils/errors";

const organizationInputSchema = z.object({
  organizationId: organizationIdSchema,
});

const personaInputSchema = organizationInputSchema.extend({
  personaId: personaIdSchema,
});

const personaReferenceInputSchema = personaInputSchema.extend({
  referenceId: z.string().min(1, "Reference ID is required"),
});

const createPersonaInputSchema = organizationInputSchema.extend({
  payload: createPersonaSchema,
});

const updatePersonaInputSchema = personaInputSchema.extend({
  payload: updatePersonaSchema,
});

const setPersonaSocialsInputSchema = personaInputSchema.and(
  setPersonaSocialsSchema
);

const createPersonaReferenceInputSchema = personaInputSchema.extend({
  payload: createPersonaReferenceSchema,
});

const updatePersonaReferenceInputSchema = personaReferenceInputSchema.extend({
  payload: updatePersonaReferenceSchema,
});

class PersonaNotFoundError extends Data.TaggedError("PersonaNotFoundError")<
  Record<string, never>
> {}

class PersonaNameTakenError extends Data.TaggedError("PersonaNameTakenError")<{
  readonly name: string;
}> {}

class PersonaMemberNotFoundError extends Data.TaggedError(
  "PersonaMemberNotFoundError"
)<Record<string, never>> {}

class MemberAlreadyLinkedError extends Data.TaggedError(
  "MemberAlreadyLinkedError"
)<{
  readonly personaName: string;
}> {}

class PersonaReferenceNotFoundError extends Data.TaggedError(
  "PersonaReferenceNotFoundError"
)<Record<string, never>> {}

class PersonaPersistenceError extends Data.TaggedError(
  "PersonaPersistenceError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

type PersonaError =
  | PersonaNotFoundError
  | PersonaNameTakenError
  | PersonaMemberNotFoundError
  | MemberAlreadyLinkedError
  | PersonaReferenceNotFoundError
  | PersonaPersistenceError;

function mapPersonaError(error: PersonaError): never {
  switch (error._tag) {
    case "PersonaNotFoundError":
      throw notFound("Persona not found");
    case "PersonaNameTakenError":
      throw conflict(`A persona named "${error.name}" already exists`);
    case "PersonaMemberNotFoundError":
      throw notFound("Member not found in this organization");
    case "MemberAlreadyLinkedError":
      throw conflict(
        `This member is already linked to the persona "${error.personaName}"`
      );
    case "PersonaReferenceNotFoundError":
      throw notFound("Reference not found");
    default:
      throw internalServerError(error.message, error.cause);
  }
}

function tryDb<T>(message: string, run: () => Promise<T>) {
  return Effect.tryPromise({
    try: run,
    catch: (cause) => new PersonaPersistenceError({ message, cause }),
  });
}

function runPersonaProgram<T>(program: Effect.Effect<T, PersonaError>) {
  return Effect.runPromise(
    program.pipe(
      Effect.match({
        onFailure: mapPersonaError,
        onSuccess: (value) => value,
      })
    )
  );
}

const personaQueryWith = {
  socials: true,
  member: {
    with: {
      users: {
        columns: { id: true, name: true, email: true, image: true },
      },
    },
  },
  references: { columns: { id: true } },
} as const;

function serializePersonaSocial(social: PersonaSocialRow): PersonaSocial {
  return {
    id: social.id,
    personaId: social.personaId,
    platform: social.platform,
    username: social.username,
    url: social.url,
    createdAt: social.createdAt.toISOString(),
    updatedAt: social.updatedAt.toISOString(),
  };
}

function serializePersona(persona: PersonaRow): Persona {
  return {
    id: persona.id,
    organizationId: persona.organizationId,
    memberId: persona.memberId,
    name: persona.name,
    title: persona.title,
    bio: persona.bio,
    avatarUrl: persona.avatarUrl,
    customInstructions: persona.customInstructions,
    socials: persona.socials.map(serializePersonaSocial),
    linkedMember: persona.member
      ? {
          id: persona.member.id,
          userId: persona.member.users.id,
          name: persona.member.users.name,
          email: persona.member.users.email,
          image: persona.member.users.image,
        }
      : null,
    referenceCount: persona.references.length,
    createdAt: persona.createdAt.toISOString(),
    updatedAt: persona.updatedAt.toISOString(),
  };
}

function serializePersonaReference(
  reference: PersonaReferenceRow
): PersonaReference {
  const metadata =
    reference.metadata && typeof reference.metadata === "object"
      ? Object.fromEntries(Object.entries(reference.metadata))
      : null;

  return {
    id: reference.id,
    personaId: reference.personaId,
    type: reference.type,
    content: reference.content,
    metadata,
    note: reference.note,
    sourceUrl: reference.sourceUrl,
    applicableTo: reference.applicableTo,
    createdAt: reference.createdAt.toISOString(),
    updatedAt: reference.updatedAt.toISOString(),
  };
}

const requirePersona = Effect.fn("requirePersona")(function* (
  organizationId: string,
  personaId: string
) {
  const persona = yield* tryDb("Failed to load persona", () =>
    db.query.personas.findFirst({
      where: and(
        eq(personas.id, personaId),
        eq(personas.organizationId, organizationId)
      ),
      columns: { id: true },
    })
  );

  if (!persona) {
    return yield* Effect.fail(new PersonaNotFoundError({}));
  }

  return persona;
});

const ensurePersonaNameAvailable = Effect.fn("ensurePersonaNameAvailable")(
  function* (organizationId: string, name: string, personaId?: string) {
    const existing = yield* tryDb("Failed to check persona name", () =>
      db.query.personas.findFirst({
        where: and(
          eq(personas.organizationId, organizationId),
          eq(personas.name, name)
        ),
        columns: { id: true },
      })
    );

    if (existing && existing.id !== personaId) {
      return yield* Effect.fail(new PersonaNameTakenError({ name }));
    }
  }
);

const ensureMemberLinkable = Effect.fn("ensureMemberLinkable")(function* (
  organizationId: string,
  memberId: string,
  personaId?: string
) {
  const member = yield* tryDb("Failed to load member", () =>
    db.query.members.findFirst({
      where: and(
        eq(members.id, memberId),
        eq(members.organizationId, organizationId)
      ),
      columns: { id: true },
    })
  );

  if (!member) {
    return yield* Effect.fail(new PersonaMemberNotFoundError({}));
  }

  const linked = yield* tryDb("Failed to check member link", () =>
    db.query.personas.findFirst({
      where: eq(personas.memberId, memberId),
      columns: { id: true, name: true },
    })
  );

  if (linked && linked.id !== personaId) {
    return yield* Effect.fail(
      new MemberAlreadyLinkedError({ personaName: linked.name })
    );
  }
});

const loadSerializedPersona = Effect.fn("loadSerializedPersona")(function* (
  personaId: string
) {
  const persona = yield* tryDb("Failed to load persona", () =>
    db.query.personas.findFirst({
      where: eq(personas.id, personaId),
      with: personaQueryWith,
    })
  );

  if (!persona) {
    return yield* Effect.fail(new PersonaNotFoundError({}));
  }

  return serializePersona(persona);
});

const requirePersonaReference = Effect.fn("requirePersonaReference")(function* (
  personaId: string,
  referenceId: string
) {
  const reference = yield* tryDb("Failed to load reference", () =>
    db.query.personaReferences.findFirst({
      where: and(
        eq(personaReferences.id, referenceId),
        eq(personaReferences.personaId, personaId)
      ),
      columns: { id: true },
    })
  );

  if (!reference) {
    return yield* Effect.fail(new PersonaReferenceNotFoundError({}));
  }

  return reference;
});

const createPersonaProgram = Effect.fn("createPersonaProgram")(function* (
  organizationId: string,
  payload: CreatePersonaInput
) {
  yield* ensurePersonaNameAvailable(organizationId, payload.name);

  const memberId = payload.memberId ?? null;
  if (memberId) {
    yield* ensureMemberLinkable(organizationId, memberId);
  }

  const personaId = nanoid();
  yield* tryDb("Failed to create persona", () =>
    db.insert(personas).values({
      id: personaId,
      organizationId,
      memberId,
      name: payload.name,
      title: payload.title ?? null,
      bio: payload.bio ?? null,
      avatarUrl: payload.avatarUrl ?? null,
      customInstructions: payload.customInstructions ?? null,
    })
  );

  return yield* loadSerializedPersona(personaId);
});

const updatePersonaProgram = Effect.fn("updatePersonaProgram")(function* (
  organizationId: string,
  personaId: string,
  payload: UpdatePersonaInput
) {
  yield* requirePersona(organizationId, personaId);

  if (payload.name !== undefined) {
    yield* ensurePersonaNameAvailable(organizationId, payload.name, personaId);
  }

  if (payload.memberId) {
    yield* ensureMemberLinkable(organizationId, payload.memberId, personaId);
  }

  yield* tryDb("Failed to update persona", () =>
    db
      .update(personas)
      .set({
        name: payload.name,
        title: payload.title,
        bio: payload.bio,
        avatarUrl: payload.avatarUrl,
        customInstructions: payload.customInstructions,
        memberId: payload.memberId,
      })
      .where(eq(personas.id, personaId))
  );

  return yield* loadSerializedPersona(personaId);
});

const setPersonaSocialsProgram = Effect.fn("setPersonaSocialsProgram")(
  function* (
    organizationId: string,
    personaId: string,
    socials: PersonaSocialInput[]
  ) {
    yield* requirePersona(organizationId, personaId);

    yield* tryDb("Failed to save persona socials", () =>
      db.transaction(async (tx) => {
        await tx
          .delete(personaSocials)
          .where(eq(personaSocials.personaId, personaId));

        if (socials.length > 0) {
          await tx.insert(personaSocials).values(
            socials.map((social) => ({
              id: nanoid(),
              personaId,
              platform: social.platform,
              username: social.username,
              url: social.url ?? null,
            }))
          );
        }
      })
    );

    return yield* loadSerializedPersona(personaId);
  }
);

const updatePersonaReferenceProgram = Effect.fn(
  "updatePersonaReferenceProgram"
)(function* (
  organizationId: string,
  personaId: string,
  referenceId: string,
  payload: UpdatePersonaReferenceInput
) {
  yield* requirePersona(organizationId, personaId);
  yield* requirePersonaReference(personaId, referenceId);

  const updated = yield* tryDb("Failed to update reference", () =>
    db
      .update(personaReferences)
      .set({
        content: payload.content,
        note: payload.note,
        sourceUrl: payload.sourceUrl,
        applicableTo: payload.applicableTo,
      })
      .where(eq(personaReferences.id, referenceId))
      .returning()
  );

  const row = updated[0];
  if (!row) {
    return yield* Effect.fail(new PersonaReferenceNotFoundError({}));
  }

  return serializePersonaReference(row);
});

export const personasRouter = {
  list: authorizedProcedure
    .input(organizationInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return runPersonaProgram(
        tryDb("Failed to list personas", () =>
          db.query.personas.findMany({
            where: eq(personas.organizationId, input.organizationId),
            with: personaQueryWith,
            orderBy: [desc(personas.createdAt)],
          })
        ).pipe(Effect.map((rows) => ({ personas: rows.map(serializePersona) })))
      );
    }),

  get: authorizedProcedure
    .input(personaInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return runPersonaProgram(
        requirePersona(input.organizationId, input.personaId).pipe(
          Effect.flatMap(() => loadSerializedPersona(input.personaId))
        )
      );
    }),

  create: authorizedProcedure
    .input(createPersonaInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return runPersonaProgram(
        createPersonaProgram(input.organizationId, input.payload)
      );
    }),

  update: authorizedProcedure
    .input(updatePersonaInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return runPersonaProgram(
        updatePersonaProgram(
          input.organizationId,
          input.personaId,
          input.payload
        )
      );
    }),

  delete: authorizedProcedure
    .input(personaInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return runPersonaProgram(
        requirePersona(input.organizationId, input.personaId).pipe(
          Effect.flatMap(() =>
            tryDb("Failed to delete persona", () =>
              db.delete(personas).where(eq(personas.id, input.personaId))
            )
          ),
          Effect.map(() => ({ success: true as const }))
        )
      );
    }),

  setSocials: authorizedProcedure
    .input(setPersonaSocialsInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return runPersonaProgram(
        setPersonaSocialsProgram(
          input.organizationId,
          input.personaId,
          input.socials
        )
      );
    }),

  references: {
    list: authorizedProcedure
      .input(personaInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        return runPersonaProgram(
          requirePersona(input.organizationId, input.personaId).pipe(
            Effect.flatMap(() =>
              tryDb("Failed to list references", () =>
                db.query.personaReferences.findMany({
                  where: eq(personaReferences.personaId, input.personaId),
                  orderBy: [desc(personaReferences.createdAt)],
                })
              )
            ),
            Effect.map((rows) => ({
              references: rows.map(serializePersonaReference),
            }))
          )
        );
      }),

    create: authorizedProcedure
      .input(createPersonaReferenceInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        return runPersonaProgram(
          requirePersona(input.organizationId, input.personaId).pipe(
            Effect.flatMap(() =>
              tryDb("Failed to create reference", () =>
                db
                  .insert(personaReferences)
                  .values({
                    id: nanoid(),
                    personaId: input.personaId,
                    type: input.payload.type,
                    content: input.payload.content,
                    note: input.payload.note ?? null,
                    sourceUrl: input.payload.sourceUrl ?? null,
                    applicableTo: input.payload.applicableTo ?? ["all"],
                  })
                  .returning()
              )
            ),
            Effect.flatMap((rows) => {
              const row = rows[0];
              return row
                ? Effect.succeed(serializePersonaReference(row))
                : Effect.fail(
                    new PersonaPersistenceError({
                      message: "Failed to create reference",
                      cause: null,
                    })
                  );
            })
          )
        );
      }),

    update: authorizedProcedure
      .input(updatePersonaReferenceInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        return runPersonaProgram(
          updatePersonaReferenceProgram(
            input.organizationId,
            input.personaId,
            input.referenceId,
            input.payload
          )
        );
      }),

    delete: authorizedProcedure
      .input(personaReferenceInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        return runPersonaProgram(
          requirePersona(input.organizationId, input.personaId).pipe(
            Effect.flatMap(() =>
              requirePersonaReference(input.personaId, input.referenceId)
            ),
            Effect.flatMap(() =>
              tryDb("Failed to delete reference", () =>
                db
                  .delete(personaReferences)
                  .where(eq(personaReferences.id, input.referenceId))
              )
            ),
            Effect.map(() => ({ success: true as const }))
          )
        );
      }),
  },
};
