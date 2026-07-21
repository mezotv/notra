import type { Metadata } from "next";
import { apiUrl, buildAgentJson, siteUrl } from "@/utils/agent-metadata";

export const metadata: Metadata = {
  title: "Notra Agent Interface",
  description:
    "Machine-readable Notra discovery view for agents, API clients, and MCP integrations.",
};

export default function AgentPage() {
  const agent = buildAgentJson();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-28">
      <div className="flex flex-col gap-3">
        <h1 className="font-semibold text-4xl tracking-tight">
          Notra Agent Interface
        </h1>
        <p className="text-muted-foreground leading-7">
          Notra turns shipped product work into changelogs, launch posts, blog
          drafts, marketing assets, and social updates in a saved brand voice.
          Agents should use this view for discovery instead of parsing the
          marketing homepage.
        </p>
      </div>
      <section className="grid gap-4 text-sm md:grid-cols-2">
        <div>
          <h2 className="font-semibold text-lg">Discovery</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Agent JSON: {siteUrl("/.well-known/agent.json")}</li>
            <li>Agent Card: {siteUrl("/.well-known/agent-card.json")}</li>
            <li>API Catalog: {siteUrl("/.well-known/api-catalog")}</li>
            <li>Auth guide: {siteUrl("/auth.md")}</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-lg">Endpoints</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>API: {apiUrl()}</li>
            <li>OpenAPI: {apiUrl("/openapi.json")}</li>
            <li>MCP: {agent.mcp.streamable_http}</li>
            <li>NLWeb ask: {siteUrl("/ask")}</li>
          </ul>
        </div>
      </section>
      <pre className="overflow-auto rounded-md border bg-muted p-4 text-xs">
        {JSON.stringify(agent, null, 2)}
      </pre>
    </main>
  );
}
