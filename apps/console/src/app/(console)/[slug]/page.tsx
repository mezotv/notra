import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import Link from "next/link";
import { validateOrganizationAccess } from "@/lib/auth/actions";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await validateOrganizationAccess(slug);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Manage integrations for {organization.name}.
        </p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome to Notra Console</CardTitle>
          <CardDescription>
            Add MCP servers without requiring an active Notra subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            nativeButton={false}
            render={<Link href={`/${organization.slug}/integrations`} />}
          >
            Manage integrations
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
