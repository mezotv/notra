import { buildAgentJson } from "@/utils/agent-metadata";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const streaming = body?.prefer?.streaming === true;
  const agent = buildAgentJson();
  const result = {
    _meta: {
      response_type: "answer",
      version: "1.0",
    },
    query: typeof body?.query === "string" ? body.query : null,
    answer:
      "Notra turns shipped work into changelogs, launch posts, blog posts, marketing assets, and social updates in a saved brand voice.",
    resources: [agent.api.openapi, agent.api.auth, agent.mcp.docs],
  };

  if (!streaming) {
    return Response.json(result);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const event of [
        { type: "start", _meta: result._meta },
        { type: "result", result },
        { type: "complete" },
      ]) {
        controller.enqueue(
          encoder.encode(
            `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
          )
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}
