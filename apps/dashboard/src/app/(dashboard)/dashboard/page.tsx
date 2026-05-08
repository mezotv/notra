import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { getAllUserOrganizations, requireAuth } from "@/lib/auth/actions";
import { cliSessionIdSchema } from "@/schemas/cli-auth";
import type { CliAuthOrganization } from "@/types/cli-auth/poll";
import { CliAuthForm } from "./cli-auth-form";

export const metadata: Metadata = {
  title: "Authorize CLI",
};

export default async function CliAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<{ cli_session?: string }>;
}) {
  await requireAuth();
  const { cli_session: rawSessionId } = await searchParams;

  const parsed = rawSessionId
    ? cliSessionIdSchema.safeParse(rawSessionId)
    : null;

  if (!parsed?.success) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
        <h1 className="font-semibold text-2xl tracking-tight">
          No CLI session
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          This page is opened automatically by the Notra CLI. Run{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            notra auth login
          </code>{" "}
          in your terminal to start.
        </p>
      </div>
    );
  }

  const memberships = await getAllUserOrganizations();
  const orgRows =
    memberships.length > 0
      ? await db.query.organizations.findMany({
          where: inArray(
            organizations.id,
            memberships.map((m) => m.id)
          ),
          columns: { id: true, name: true, slug: true, logo: true },
        })
      : [];

  const orgs: CliAuthOrganization[] = orgRows.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    logo: o.logo,
  }));

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <CliAuthForm organizations={orgs} sessionId={parsed.data} />
    </div>
  );
}
