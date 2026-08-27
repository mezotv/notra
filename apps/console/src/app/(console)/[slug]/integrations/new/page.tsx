import type { Metadata } from "next";

import { IntegrationForm } from "@/components/integrations/integration-form";
import { validateOrganizationAccess } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "New integration · Notra Console",
};

export default async function NewIntegrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await validateOrganizationAccess(slug);

  return <IntegrationForm organizationId={organization.id} slug={slug} />;
}
