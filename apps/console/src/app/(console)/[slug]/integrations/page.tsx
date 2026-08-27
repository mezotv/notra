import type { Metadata } from "next";

import { IntegrationsPageClient } from "@/components/integrations/integrations-page-client";
import { validateOrganizationAccess } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Integrations · Notra Console",
};

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await validateOrganizationAccess(slug);

  return (
    <IntegrationsPageClient organizationId={organization.id} slug={slug} />
  );
}
