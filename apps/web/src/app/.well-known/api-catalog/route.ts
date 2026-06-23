import { apiUrl, siteUrl } from "@/utils/agent-metadata";
import { jsonResponse } from "@/utils/http";
import { DOCS_URL } from "@/utils/urls";

export function GET() {
  return jsonResponse(
    {
      linkset: [
        {
          anchor: siteUrl(),
          item: [
            {
              href: apiUrl("/openapi.json"),
              rel: "service-desc",
              type: "application/openapi+json",
              title: "Notra Public API OpenAPI schema",
            },
            {
              href: DOCS_URL,
              rel: "service-doc",
              type: "text/html",
              title: "Notra developer documentation",
            },
            {
              href: siteUrl("/auth.md"),
              rel: "authorization-server-metadata",
              type: "text/markdown",
              title: "Notra agent authentication guide",
            },
          ],
        },
      ],
    },
    {
      contentType:
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"; charset=utf-8',
    }
  );
}
