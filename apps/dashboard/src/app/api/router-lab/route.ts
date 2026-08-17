import { withRouterDefaults } from "@notra/ai/provider-options";
import { createOpenRouterAdapter } from "@notra/ai/router/adapters/openrouter";
import { createVercelAdapter } from "@notra/ai/router/adapters/vercel";
import { createModelRouter } from "@notra/ai/router/create-router";
import type {
  GatewayAdapter,
  GatewayId,
  Plan,
  RouterLogFields,
} from "@notra/ai/router/types";
import { generateText, Output, streamText, tool } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";
const DEFAULT_MAX_OUTPUT_TOKENS = 200;
const MAX_TOOL_STEPS = 3;

const requestSchema = z.object({
  modelId: z.string().min(1).default(DEFAULT_MODEL),
  prompt: z.string().min(1).default("Reply with the single word: pong"),
  organizationId: z.string().optional(),
  plan: z.enum(["free", "paid"]).default("free"),
  gateway: z.enum(["vercel", "openrouter"]).optional(),
  defaultGateway: z.enum(["vercel", "openrouter"]).default("openrouter"),
  paidGateway: z.enum(["vercel", "openrouter"]).default("vercel"),
  freeGateway: z.enum(["vercel", "openrouter"]).default("openrouter"),
  allowNonZdr: z.boolean().default(true),
  crossGatewayFallback: z.boolean().default(true),
  disableVercel: z.boolean().default(false),
  disableOpenRouter: z.boolean().default(false),
  scenario: z.enum(["text", "stream", "tools", "structured"]).default("text"),
  checkCredits: z.boolean().default(true),
  maxOutputTokens: z
    .number()
    .int()
    .positive()
    .default(DEFAULT_MAX_OUTPUT_TOKENS),
});

interface LogEntry {
  level: "info" | "warn" | "error";
  event: string;
  fields?: RouterLogFields;
}

function buildAdapters(input: z.infer<typeof requestSchema>) {
  const adapters: Partial<Record<GatewayId, GatewayAdapter>> = {};
  const vercelKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (vercelKey && !input.disableVercel) {
    adapters.vercel = createVercelAdapter({ apiKey: vercelKey });
  }
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey && !input.disableOpenRouter) {
    adapters.openrouter = createOpenRouterAdapter({ apiKey: openRouterKey });
  }
  return adapters;
}

function summarizeRequestBody(body: unknown) {
  const parsed =
    typeof body === "string"
      ? (JSON.parse(body) as Record<string, unknown>)
      : body;
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  return {
    model: record.model,
    provider: record.provider,
    providerOptions: record.providerOptions,
    usage: record.usage,
    models: record.models,
    reasoning: record.reasoning,
  };
}

function toErrorPayload(error: unknown) {
  if (!(error instanceof Error)) {
    return { name: "UnknownError", message: String(error) };
  }
  const record = error as Error & Record<string, unknown>;
  return {
    name: error.name,
    message: error.message,
    code: typeof record.code === "string" ? record.code : undefined,
    statusCode:
      typeof record.statusCode === "number" ? record.statusCode : undefined,
    gateway: typeof record.gateway === "string" ? record.gateway : undefined,
  };
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const input = parsed.data;
  const logs: LogEntry[] = [];
  const startedAt = Date.now();

  const router = createModelRouter({
    adapters: buildAdapters(input),
    resolvePlan: () => Promise.resolve(input.plan as Plan),
    policy: {
      defaultGateway: input.defaultGateway,
      paidGateway: input.paidGateway,
      freeGateway: input.freeGateway,
      allowNonZdr: input.allowNonZdr,
      crossGatewayFallback: input.crossGatewayFallback,
    },
    logger: {
      info: (event, fields) => logs.push({ level: "info", event, fields }),
      warn: (event, fields) => logs.push({ level: "warn", event, fields }),
      error: (event, fields) => logs.push({ level: "error", event, fields }),
    },
  });

  const routeRequest = {
    modelId: input.modelId,
    organizationId: input.organizationId || undefined,
    gateway: input.gateway,
  };

  try {
    const decision = input.checkCredits
      ? await router.assertRouteHasCredits(routeRequest)
      : await router.resolveRoute(routeRequest);

    const model = router.model(input.modelId, {
      organizationId: routeRequest.organizationId,
      gateway: input.gateway,
    });
    const providerOptions = withRouterDefaults(undefined, {
      modelId: input.modelId,
    });

    let text = "";
    let output: unknown;
    let toolCalls: string[] = [];
    let steps: Record<string, unknown>[] = [];
    let requestBody: unknown;
    let firstTokenMs: number | undefined;

    if (input.scenario === "stream") {
      const stream = streamText({
        model,
        prompt: input.prompt,
        maxOutputTokens: input.maxOutputTokens,
        providerOptions,
      });
      for await (const delta of stream.textStream) {
        firstTokenMs ??= Date.now() - startedAt;
        text += delta;
      }
      const finished = await stream.steps;
      steps = finished.map((step) => ({
        route: router.getRouteMetadata(step.providerMetadata),
        usage: step.usage,
      }));
      requestBody = (await stream.request).body;
    } else if (input.scenario === "tools") {
      const result = await generateText({
        model,
        prompt: input.prompt,
        tools: {
          multiply: tool({
            description: "Multiply two numbers",
            inputSchema: z.object({ a: z.number(), b: z.number() }),
            execute: ({ a, b }) => Promise.resolve({ product: a * b }),
          }),
        },
        stopWhen: ({ steps: done }) => done.length >= MAX_TOOL_STEPS,
        maxOutputTokens: input.maxOutputTokens,
        providerOptions,
      });
      text = result.text;
      toolCalls = result.steps.flatMap((step) =>
        step.toolCalls.map((call) => call.toolName)
      );
      steps = result.steps.map((step) => ({
        route: router.getRouteMetadata(step.providerMetadata),
        usage: step.usage,
      }));
      requestBody = result.request.body;
    } else if (input.scenario === "structured") {
      const result = await generateText({
        model,
        output: Output.object({
          schema: z.object({
            answer: z.string(),
            confidence: z.number().min(0).max(1),
          }),
        }),
        prompt: input.prompt,
        maxOutputTokens: input.maxOutputTokens,
        providerOptions,
      });
      output = result.output;
      text = result.text;
      steps = [
        {
          route: router.getRouteMetadata(result.providerMetadata),
          usage: result.usage,
        },
      ];
      requestBody = result.request.body;
    } else {
      const result = await generateText({
        model,
        prompt: input.prompt,
        maxOutputTokens: input.maxOutputTokens,
        providerOptions,
      });
      text = result.text;
      steps = [
        {
          route: router.getRouteMetadata(result.providerMetadata),
          usage: result.usage,
        },
      ];
      requestBody = result.request.body;
    }

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      firstTokenMs,
      decision,
      text,
      output,
      toolCalls,
      steps,
      requestBody: summarizeRequestBody(requestBody),
      logs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        durationMs: Date.now() - startedAt,
        error: toErrorPayload(error),
        logs,
      },
      { status: 200 }
    );
  }
}
