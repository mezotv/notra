export function jsonResponse(
  body: unknown,
  init: ResponseInit & { contentType?: string } = {}
) {
  const { contentType, ...responseInit } = init;
  const headers = new Headers(init.headers);
  headers.set(
    "content-type",
    contentType ?? "application/json; charset=utf-8"
  );
  headers.set("cache-control", "public, max-age=3600");

  return new Response(JSON.stringify(body, null, 2), {
    ...responseInit,
    headers,
  });
}

export function markdownResponse(content: string, status = 200) {
  return new Response(content, {
    status,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
