import { createRoute } from "@hono/zod-openapi";
import { skills } from "@notra/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  ORGANIZATION_SCOPED_API_KEY_ERROR,
  SKILL_NOT_FOUND_ERROR,
  SYSTEM_SKILL_DELETE_ERROR,
  SYSTEM_SKILL_RENAME_ERROR,
} from "../constants/skills";
import {
  createSkillRequestSchema,
  createSkillResponseSchema,
  deleteSkillResponseSchema,
  listSkillsResponseSchema,
  patchSkillRequestSchema,
  patchSkillResponseSchema,
  skillParamsSchema,
  skillResponseSchema,
} from "../schemas/skills";
import { createOpenApiApp } from "../utils/openapi-app";
import { errorResponse } from "../utils/openapi-responses";
import { isPgUniqueViolation } from "../utils/pg-errors";
import {
  getScopedOrganizationId,
  serializeSkill,
  serializeSkillSummary,
} from "../utils/skills";

export const skillsRoutes = createOpenApiApp();

const listSkillsRoute = createRoute({
  method: "get",
  path: "/skills",
  tags: ["Skills"],
  operationId: "listSkills",
  summary: "List skills",
  responses: {
    200: {
      description: "Skills fetched successfully",
      content: { "application/json": { schema: listSkillsResponseSchema } },
    },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    503: errorResponse("Authentication service unavailable"),
  },
});

const getSkillRoute = createRoute({
  method: "get",
  path: "/skills/{name}",
  tags: ["Skills"],
  operationId: "getSkill",
  summary: "Get a single skill",
  request: { params: skillParamsSchema },
  responses: {
    200: {
      description: "Skill fetched successfully",
      content: { "application/json": { schema: skillResponseSchema } },
    },
    400: errorResponse("Invalid path params"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse(SKILL_NOT_FOUND_ERROR),
    503: errorResponse("Authentication service unavailable"),
  },
});

const createSkillRoute = createRoute({
  method: "post",
  path: "/skills",
  tags: ["Skills"],
  operationId: "createSkill",
  summary: "Create a skill",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: createSkillRequestSchema } },
    },
  },
  responses: {
    201: {
      description: "Skill created successfully",
      content: { "application/json": { schema: createSkillResponseSchema } },
    },
    400: errorResponse("Invalid request body"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    409: errorResponse("Skill name already exists"),
    503: errorResponse("Authentication service unavailable"),
  },
});

const patchSkillRoute = createRoute({
  method: "patch",
  path: "/skills/{name}",
  tags: ["Skills"],
  operationId: "patchSkill",
  summary: "Update a skill",
  request: {
    params: skillParamsSchema,
    body: {
      required: true,
      content: { "application/json": { schema: patchSkillRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Skill updated successfully",
      content: { "application/json": { schema: patchSkillResponseSchema } },
    },
    400: errorResponse("Invalid path params or request body"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse(SKILL_NOT_FOUND_ERROR),
    409: errorResponse("Skill name already exists"),
    503: errorResponse("Authentication service unavailable"),
  },
});

const deleteSkillRoute = createRoute({
  method: "delete",
  path: "/skills/{name}",
  tags: ["Skills"],
  operationId: "deleteSkill",
  summary: "Delete a skill",
  request: { params: skillParamsSchema },
  responses: {
    200: {
      description: "Skill deleted successfully",
      content: { "application/json": { schema: deleteSkillResponseSchema } },
    },
    400: errorResponse("Invalid path params"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse(SKILL_NOT_FOUND_ERROR),
    503: errorResponse("Authentication service unavailable"),
  },
});

skillsRoutes.openapi(listSkillsRoute, async (c) => {
  const organizationId = getScopedOrganizationId(c);
  if (!organizationId) {
    return c.json({ error: ORGANIZATION_SCOPED_API_KEY_ERROR }, 403);
  }

  const rows = await c
    .get("db")
    .select({
      id: skills.id,
      name: skills.name,
      description: skills.description,
      isSystem: skills.isSystem,
      updatedAt: skills.updatedAt,
    })
    .from(skills)
    .where(eq(skills.organizationId, organizationId))
    .orderBy(asc(skills.name));

  return c.json({ skills: rows.map(serializeSkillSummary) }, 200);
});

skillsRoutes.openapi(getSkillRoute, async (c) => {
  const organizationId = getScopedOrganizationId(c);
  if (!organizationId) {
    return c.json({ error: ORGANIZATION_SCOPED_API_KEY_ERROR }, 403);
  }

  const { name } = c.req.valid("param");
  const skill = await c.get("db").query.skills.findFirst({
    where: and(
      eq(skills.organizationId, organizationId),
      eq(skills.name, name)
    ),
  });

  if (!skill) {
    return c.json({ error: SKILL_NOT_FOUND_ERROR }, 404);
  }

  return c.json({ skill: serializeSkill(skill) }, 200);
});

skillsRoutes.openapi(createSkillRoute, async (c) => {
  const organizationId = getScopedOrganizationId(c);
  if (!organizationId) {
    return c.json({ error: ORGANIZATION_SCOPED_API_KEY_ERROR }, 403);
  }

  const body = c.req.valid("json");

  try {
    const [created] = await c
      .get("db")
      .insert(skills)
      .values({
        id: nanoid(),
        organizationId,
        name: body.name,
        description: body.description,
        content: body.content,
        isSystem: false,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create skill");
    }

    return c.json({ skill: serializeSkill(created) }, 201);
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      return c.json(
        { error: `A skill named "${body.name}" already exists` },
        409
      );
    }
    throw error;
  }
});

skillsRoutes.openapi(patchSkillRoute, async (c) => {
  const organizationId = getScopedOrganizationId(c);
  if (!organizationId) {
    return c.json({ error: ORGANIZATION_SCOPED_API_KEY_ERROR }, 403);
  }

  const { name } = c.req.valid("param");
  const body = c.req.valid("json");
  const existing = await c.get("db").query.skills.findFirst({
    where: and(
      eq(skills.organizationId, organizationId),
      eq(skills.name, name)
    ),
    columns: { id: true, isSystem: true },
  });

  if (!existing) {
    return c.json({ error: SKILL_NOT_FOUND_ERROR }, 404);
  }

  const nextName = body.name ?? name;
  if (existing.isSystem && nextName !== name) {
    return c.json({ error: SYSTEM_SKILL_RENAME_ERROR }, 403);
  }

  try {
    const [updated] = await c
      .get("db")
      .update(skills)
      .set({
        name: nextName,
        description: body.description,
        content: body.content,
        updatedAt: new Date(),
      })
      .where(
        and(eq(skills.organizationId, organizationId), eq(skills.name, name))
      )
      .returning();

    if (!updated) {
      return c.json({ error: SKILL_NOT_FOUND_ERROR }, 404);
    }

    return c.json({ skill: serializeSkill(updated) }, 200);
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      return c.json(
        { error: `A skill named "${nextName}" already exists` },
        409
      );
    }
    throw error;
  }
});

skillsRoutes.openapi(deleteSkillRoute, async (c) => {
  const organizationId = getScopedOrganizationId(c);
  if (!organizationId) {
    return c.json({ error: ORGANIZATION_SCOPED_API_KEY_ERROR }, 403);
  }

  const { name } = c.req.valid("param");
  const existing = await c.get("db").query.skills.findFirst({
    where: and(
      eq(skills.organizationId, organizationId),
      eq(skills.name, name)
    ),
    columns: { id: true, isSystem: true },
  });

  if (!existing) {
    return c.json({ error: SKILL_NOT_FOUND_ERROR }, 404);
  }

  if (existing.isSystem) {
    return c.json({ error: SYSTEM_SKILL_DELETE_ERROR }, 403);
  }

  await c
    .get("db")
    .delete(skills)
    .where(
      and(eq(skills.organizationId, organizationId), eq(skills.name, name))
    );

  return c.json({ success: true as const }, 200);
});
