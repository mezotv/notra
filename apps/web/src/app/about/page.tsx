import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Notra",
  description:
    "Learn about Notra, the AI content-generation platform for product and engineering teams.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-28">
      <div className="flex flex-col gap-4">
        <h1 className="font-semibold text-4xl tracking-tight">About Notra</h1>
        <p className="text-muted-foreground leading-7">
          Notra is an AI content-generation platform for product and engineering
          teams. It turns shipped work into changelogs, launch posts, blog
          drafts, marketing assets, and social updates that match a team's own
          voice. The product is built for teams that already ship quickly but
          lose time collecting context, asking engineers what changed, and
          rewriting rough notes into publishable updates.
        </p>
        <p className="text-muted-foreground leading-7">
          Notra connects to the systems where product work happens, including
          GitHub today and additional workflow tools over time. It uses those
          signals to assemble a timeline of changes, draft content from the
          facts, and preserve brand voice through reusable references and
          writing skills. Teams can review every draft before publishing.
        </p>
        <p className="text-muted-foreground leading-7">
          Agents can discover Notra through{" "}
          <Link className="underline" href="/llms.txt">
            llms.txt
          </Link>
          ,{" "}
          <Link className="underline" href="/.well-known/agent.json">
            agent.json
          </Link>
          , the public OpenAPI schema, and MCP documentation.
        </p>
      </div>
    </main>
  );
}
