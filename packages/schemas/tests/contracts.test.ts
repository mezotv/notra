import { describe, expect, test } from "bun:test";

import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { createEventTriggerRequestSchema } from "@notra/schemas/api/event-triggers";
import {
  getSchedulesQuerySchema,
  scheduleSourceConfigSchema,
} from "@notra/schemas/api/schedules";
import {
  createSkillRequestSchema,
  createSkillResponseSchema,
} from "@notra/schemas/api/skills";
import { scheduleCronSchema } from "@notra/schemas/dashboard/automation/schedule-form";
import { configureEventTriggerBodySchema } from "@notra/schemas/dashboard/integrations";
import { createSkillSchema } from "@notra/schemas/dashboard/skills";
import { uploadAvatarSchema } from "@notra/schemas/dashboard/upload";

describe("shared skill validation", () => {
  test.each([
    {
      name: " humanizer ",
      description: " Polish text ",
      content: "# Instructions",
    },
    { name: "Invalid Name", description: "Description", content: "Body" },
    { name: "a".repeat(65), description: "Description", content: "Body" },
    { name: "valid", description: " ", content: "Body" },
    { name: "valid", description: "Description", content: "" },
  ])("dashboard and API agree on input %j", (input) => {
    const dashboard = createSkillSchema.safeParse(input);
    const api = createSkillRequestSchema.safeParse(input);
    expect(api.success).toBe(dashboard.success);
    if (api.success && dashboard.success) {
      expect(api.data).toEqual(dashboard.data);
    } else if (!api.success && !dashboard.success) {
      expect(api.error.issues).toEqual(dashboard.error.issues);
    }
  });

  test("retains Standard Schema validation for forms and oRPC", async () => {
    const result = await createSkillSchema["~standard"].validate({
      name: " skill ",
      description: " Description ",
      content: "Body",
    });
    expect(result).toEqual({
      value: { name: "skill", description: "Description", content: "Body" },
    });
  });
});

describe("automation contracts", () => {
  test("event source configuration is the same schema instance", () => {
    expect(createEventTriggerRequestSchema.shape.sourceConfig).toBe(
      configureEventTriggerBodySchema.shape.sourceConfig
    );
    expect(
      createEventTriggerRequestSchema.shape.sourceConfig.parse({
        eventTypes: ["release"],
      })
    ).toEqual({
      eventTypes: ["release"],
      includePreReleases: true,
    });
    expect(
      createEventTriggerRequestSchema.shape.sourceConfig.safeParse({
        eventTypes: [],
      }).success
    ).toBe(false);
  });

  test("preserves API-specific calendar and weekly requirements", () => {
    const weekly = { frequency: "weekly", hour: 9, minute: 0 };
    expect(scheduleCronSchema.safeParse(weekly).success).toBe(true);
    expect(scheduleSourceConfigSchema.safeParse({ cron: weekly }).success).toBe(
      false
    );
    expect(
      scheduleSourceConfigSchema.safeParse({
        cron: { ...weekly, dayOfWeek: 1 },
      }).success
    ).toBe(true);
    const custom = {
      frequency: "custom",
      hour: 9,
      minute: 0,
      intervalDays: 3,
      anchorDate: "2026-02-30",
    };
    expect(scheduleCronSchema.safeParse(custom).success).toBe(true);
    expect(scheduleSourceConfigSchema.safeParse({ cron: custom }).success).toBe(
      false
    );
    expect(
      scheduleCronSchema.safeParse({ ...custom, intervalDays: 0 }).success
    ).toBe(false);
  });

  test("preserves query normalization", () => {
    expect(
      getSchedulesQuerySchema.parse({ repositoryIds: " a, b, a, " })
    ).toEqual({ repositoryIds: ["a", "b"] });
    expect(getSchedulesQuerySchema.parse({})).toEqual({ repositoryIds: [] });
  });
});

test("public schemas still generate OpenAPI request and response definitions", () => {
  const app = new OpenAPIHono();
  app.openapi(
    createRoute({
      method: "post",
      path: "/skills",
      request: {
        body: {
          content: { "application/json": { schema: createSkillRequestSchema } },
        },
      },
      responses: {
        200: {
          description: "Created skill",
          content: {
            "application/json": { schema: createSkillResponseSchema },
          },
        },
      },
    }),
    (c) =>
      c.json({
        skill: {
          id: "1",
          name: "skill",
          description: "Description",
          content: "Body",
          isSystem: false,
          createdAt: "2026-09-07",
          updatedAt: "2026-09-07",
        },
      })
  );
  const document = app.getOpenAPI31Document({
    openapi: "3.1.0",
    info: { title: "Contracts", version: "1" },
  });
  expect(document.paths?.["/skills"]?.post).toBeDefined();
  expect(document.components?.schemas?.CreateSkillRequest).toMatchObject({
    type: "object",
    properties: {
      name: { type: "string", maxLength: 64, example: "humanizer" },
    },
  });
});

test("upload coercion and limits survive extraction", () => {
  expect(
    uploadAvatarSchema.parse({
      type: "avatar",
      fileType: "image/png",
      fileSize: "1024",
    }).fileSize
  ).toBe(1024);
  expect(
    uploadAvatarSchema.safeParse({
      type: "avatar",
      fileType: "image/png",
      fileSize: -1,
    }).success
  ).toBe(false);
});

test("all extracted schema entrypoints load without application aliases or server initialization", async () => {
  const root = new URL("../src/schemas/", import.meta.url);
  let count = 0;
  for await (const path of new Bun.Glob("**/*.ts").scan({
    cwd: root.pathname,
  })) {
    await import(new URL(path, root).href);
    count++;
  }
  expect(count).toBeGreaterThanOrEqual(78);
});

test("representative dashboard schemas bundle for browsers without Hono", async () => {
  const result = await Bun.build({
    entrypoints: ["skills", "automation/schedule-form", "geo-shelf"].map(
      (domain) =>
        new URL(`../src/schemas/dashboard/${domain}.ts`, import.meta.url)
          .pathname
    ),
    target: "browser",
  });
  expect(result.success).toBe(true);
  for (const output of result.outputs) {
    expect(await output.text()).not.toContain("hono/dist/");
  }
});
