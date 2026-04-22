import { db } from "@notra/db/drizzle";
import { skills } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { authorizedProcedure } from "@/lib/orpc/base";
import { organizationIdSchema } from "@/schemas/auth/organization";
import {
  createSkillSchema,
  skillNameSchema,
  updateSkillSchema,
} from "@/schemas/skills";
import { conflict, forbidden, notFound } from "../utils/errors";

const listSkillsInput = z.object({
  organizationId: organizationIdSchema,
});

const getSkillInput = z.object({
  organizationId: organizationIdSchema,
  name: skillNameSchema,
});

const createSkillInput = z.object({
  organizationId: organizationIdSchema,
  payload: createSkillSchema,
});

const updateSkillInput = z.object({
  organizationId: organizationIdSchema,
  name: skillNameSchema,
  payload: updateSkillSchema,
});

const deleteSkillInput = z.object({
  organizationId: organizationIdSchema,
  name: skillNameSchema,
});

export const skillsRouter = {
  list: authorizedProcedure
    .input(listSkillsInput)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const rows = await db
        .select({
          id: skills.id,
          name: skills.name,
          description: skills.description,
          isSystem: skills.isSystem,
          updatedAt: skills.updatedAt,
        })
        .from(skills)
        .where(eq(skills.organizationId, input.organizationId));

      return rows;
    }),

  getByName: authorizedProcedure
    .input(getSkillInput)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const row = await db.query.skills.findFirst({
        where: and(
          eq(skills.organizationId, input.organizationId),
          eq(skills.name, input.name)
        ),
      });

      if (!row) {
        throw notFound("Skill not found");
      }

      return row;
    }),

  create: authorizedProcedure
    .input(createSkillInput)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const existing = await db.query.skills.findFirst({
        where: and(
          eq(skills.organizationId, input.organizationId),
          eq(skills.name, input.payload.name)
        ),
        columns: { id: true },
      });

      if (existing) {
        throw conflict(`A skill named "${input.payload.name}" already exists`);
      }

      const [created] = await db
        .insert(skills)
        .values({
          id: nanoid(),
          organizationId: input.organizationId,
          name: input.payload.name,
          description: input.payload.description,
          content: input.payload.content,
          isSystem: false,
        })
        .returning({
          name: skills.name,
        });

      return { name: created?.name ?? input.payload.name };
    }),

  update: authorizedProcedure
    .input(updateSkillInput)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const row = await db.query.skills.findFirst({
        where: and(
          eq(skills.organizationId, input.organizationId),
          eq(skills.name, input.name)
        ),
        columns: { id: true, isSystem: true },
      });

      if (!row) {
        throw notFound("Skill not found");
      }

      const nextName = input.payload.name ?? input.name;
      const isRename = nextName !== input.name;

      if (isRename && row.isSystem) {
        throw forbidden("System skills cannot be renamed");
      }

      if (isRename) {
        const conflictRow = await db.query.skills.findFirst({
          where: and(
            eq(skills.organizationId, input.organizationId),
            eq(skills.name, nextName)
          ),
          columns: { id: true },
        });

        if (conflictRow) {
          throw conflict(`A skill named "${nextName}" already exists`);
        }
      }

      await db
        .update(skills)
        .set({
          name: nextName,
          description: input.payload.description,
          content: input.payload.content,
        })
        .where(
          and(
            eq(skills.organizationId, input.organizationId),
            eq(skills.name, input.name)
          )
        );

      return { success: true as const, name: nextName };
    }),

  delete: authorizedProcedure
    .input(deleteSkillInput)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const row = await db.query.skills.findFirst({
        where: and(
          eq(skills.organizationId, input.organizationId),
          eq(skills.name, input.name)
        ),
        columns: { id: true, isSystem: true },
      });

      if (!row) {
        throw notFound("Skill not found");
      }

      if (row.isSystem) {
        throw forbidden("System skills cannot be deleted");
      }

      await db
        .delete(skills)
        .where(
          and(
            eq(skills.organizationId, input.organizationId),
            eq(skills.name, input.name)
          )
        );

      return { success: true as const };
    }),
};
