import { describe, expect, test } from "bun:test";

import {
  FeedbackSubmitError,
  registerFeedbackTool,
  submitFeedback,
} from "../src/feedback";
import type {
  FeedbackToolResult,
  FeedbackToolServer,
} from "../src/feedback/types";

function jsonResponse(body: unknown, status = 202): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("submitFeedback", () => {
  test("posts to /v1/feedback with the bearer token", async () => {
    let captured: { url: string; init?: RequestInit } | null = null;
    const result = await submitFeedback(
      { message: "hello", kind: "bug" },
      {
        token: "nfb_org.sig",
        endpoint: "https://api.example.com/",
        fetch: (url, init) => {
          captured = { url: String(url), init };
          return Promise.resolve(
            jsonResponse({ feedback: { id: "fb_1" }, deduplicated: false })
          );
        },
      }
    );

    expect(result).toEqual({ id: "fb_1", deduplicated: false });
    expect(captured?.url).toBe("https://api.example.com/v1/feedback");
    const headers = captured?.init?.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer nfb_org.sig");
    expect(JSON.parse(String(captured?.init?.body))).toEqual({
      message: "hello",
      kind: "bug",
    });
  });

  test("throws FeedbackSubmitError with the API message", async () => {
    await expect(
      submitFeedback(
        { message: "hello" },
        {
          token: "bad",
          fetch: () =>
            Promise.resolve(
              jsonResponse({ error: "Invalid feedback token" }, 401)
            ),
        }
      )
    ).rejects.toMatchObject({
      name: "FeedbackSubmitError",
      status: 401,
      message: "Invalid feedback token",
    });
    expect(new FeedbackSubmitError(500, "x").status).toBe(500);
  });
});

describe("registerFeedbackTool", () => {
  test("registers submit_feedback and forwards arguments", async () => {
    let registeredName = "";
    let registeredDescription = "";
    let handler:
      | ((args: Record<string, unknown>) => Promise<FeedbackToolResult>)
      | null = null;
    const server: FeedbackToolServer = {
      registerTool(name, config, callback) {
        registeredName = name;
        registeredDescription = config.description;
        handler = callback;
      },
    };
    let sentBody: Record<string, unknown> = {};

    registerFeedbackTool(server, {
      token: "nfb_org.sig",
      productName: "Acme",
      defaults: { agentClient: "acme-mcp" },
      fetch: (_url, init) => {
        sentBody = JSON.parse(String(init?.body));
        return Promise.resolve(
          jsonResponse({ feedback: { id: "fb_2" }, deduplicated: false })
        );
      },
    });

    expect(registeredName).toBe("submit_feedback");
    expect(registeredDescription).toContain("Acme");
    if (!handler) {
      throw new Error("handler was not registered");
    }
    const callHandler = handler;

    const result = await callHandler({
      message: "Search is broken",
      kind: "bug",
    });
    expect(result.isError).toBeUndefined();
    expect(sentBody).toEqual({
      agentClient: "acme-mcp",
      message: "Search is broken",
      kind: "bug",
    });

    const invalid = await callHandler({ message: "" });
    expect(invalid.isError).toBe(true);
  });
});
