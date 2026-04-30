import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { chatWorkflowHandler } from "../lib/chat/workflow-handler";

export const chatWorkflowRoutes = new OpenAPIHono();

chatWorkflowRoutes.post("/internal/workflows/chat", (c: Context) =>
  chatWorkflowHandler(c)
);
