import { db } from "@notra/db/drizzle";
import { htmlDocuments, members } from "@notra/db/schema";
import { ORPCError } from "@orpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import z from "zod";
import { authorizedProcedure } from "@/lib/orpc/base";

const MAX_HTML_DOCUMENT_SIZE = 5 * 1024 * 1024;
const MAX_HTML_DOCUMENTS_PER_REQUEST = 50;

const createDocumentSchema = z.object({
  name: z.string().min(1).max(512),
  content: z
    .string()
    .min(1)
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= MAX_HTML_DOCUMENT_SIZE,
      {
        message: `HTML document must be less than ${MAX_HTML_DOCUMENT_SIZE / 1024 / 1024}MB`,
      }
    ),
});

const deleteDocumentsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(MAX_HTML_DOCUMENTS_PER_REQUEST),
});

async function requireOrganizationAccess(
  userId: string,
  organizationId: string | null | undefined
) {
  if (!organizationId) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Active organization required",
    });
  }

  const membership = await db.query.members.findFirst({
    where: and(
      eq(members.userId, userId),
      eq(members.organizationId, organizationId)
    ),
    columns: { id: true },
  });

  if (!membership) {
    throw new ORPCError("FORBIDDEN", {
      message: "You do not have access to this organization",
    });
  }

  return organizationId;
}

export const htmlRouter = {
  list: authorizedProcedure.handler(async ({ context }) => {
    const organizationId = await requireOrganizationAccess(
      context.user.id,
      context.session?.activeOrganizationId
    );

    const rows = await db
      .select()
      .from(htmlDocuments)
      .where(eq(htmlDocuments.organizationId, organizationId))
      .orderBy(desc(htmlDocuments.createdAt), desc(htmlDocuments.id));

    return {
      documents: rows.map((row) => ({
        id: row.id,
        name: row.name,
        content: row.content,
        size: row.size,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    };
  }),
  create: authorizedProcedure
    .input(createDocumentSchema)
    .handler(async ({ context, input }) => {
      const organizationId = await requireOrganizationAccess(
        context.user.id,
        context.session?.activeOrganizationId
      );

      const id = nanoid();
      const size = Buffer.byteLength(input.content, "utf8");

      const [row] = await db
        .insert(htmlDocuments)
        .values({
          id,
          organizationId,
          userId: context.user.id,
          name: input.name,
          content: input.content,
          size,
        })
        .returning();

      return {
        id: row?.id ?? id,
        name: row?.name ?? input.name,
        content: row?.content ?? input.content,
        size: row?.size ?? size,
        createdAt: row?.createdAt ?? new Date(),
        updatedAt: row?.updatedAt ?? new Date(),
      };
    }),
  deleteMany: authorizedProcedure
    .input(deleteDocumentsSchema)
    .handler(async ({ context, input }) => {
      const organizationId = await requireOrganizationAccess(
        context.user.id,
        context.session?.activeOrganizationId
      );

      await db
        .delete(htmlDocuments)
        .where(
          and(
            eq(htmlDocuments.organizationId, organizationId),
            inArray(htmlDocuments.id, input.ids)
          )
        );

      return { success: true, deleted: input.ids.length };
    }),
};
