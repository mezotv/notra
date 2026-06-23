import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Notra",
  description:
    "Contact Notra for support, sales, security questions, and agent integration help.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-28">
      <div className="flex flex-col gap-4">
        <h1 className="font-semibold text-4xl tracking-tight">Contact Notra</h1>
        <p className="text-muted-foreground leading-7">
          Contact Notra for product questions, support, security reports,
          partnership requests, and developer integration help. The best general
          contact address is{" "}
          <a className="underline" href="mailto:hello@usenotra.com">
            hello@usenotra.com
          </a>
          . For product support, write to{" "}
          <a className="underline" href="mailto:support@usenotra.com">
            support@usenotra.com
          </a>
          . Include your workspace name, the API endpoint or MCP client you are
          using, relevant request IDs, and a short description of the issue.
        </p>
        <p className="text-muted-foreground leading-7">
          Developers and AI agents should start with the{" "}
          <Link className="underline" href="/auth.md">
            agent authentication guide
          </Link>
          , the{" "}
          <Link className="underline" href="/.well-known/api-catalog">
            API catalog
          </Link>
          , and the scoped{" "}
          <Link className="underline" href="/developers/llms.txt">
            developer llms.txt
          </Link>
          . These resources describe API authentication, OpenAPI discovery, MCP
          usage, sandbox reachability, and retry guidance.
        </p>
      </div>
    </main>
  );
}
