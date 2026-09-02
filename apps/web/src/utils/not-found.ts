import { NOT_FOUND_MARKDOWN } from "@/constants/not-found";

export function markdownNotFoundResponse() {
  return new Response(NOT_FOUND_MARKDOWN, {
    status: 404,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=300",
      vary: "Accept",
    },
  });
}
