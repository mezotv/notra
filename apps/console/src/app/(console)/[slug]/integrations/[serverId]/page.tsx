import type { Metadata } from "next";
import { IntegrationEditClient } from "@/components/integrations/integration-edit-client";
import { validateOrganizationAccess } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Edit integration · Notra Console",
};

export default async function EditIntegrationPage({
  params,
}: {
  params: Promise<{ slug: string; serverId: string }>;
}) {
  const { slug, serverId } = await params;
  const { organization } = await validateOrganizationAccess(slug);

  return (
    <IntegrationEditClient
      organizationId={organization.id}
      serverId={serverId}
      slug={slug}
    />
  );
}
