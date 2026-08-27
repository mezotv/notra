import { notFound } from "next/navigation";

import { IntegrationModal } from "@/components/integrations/integration-modal";
import { fetchIntegration } from "@/lib/integrations/fetch";
import type { IntegrationDetailPageProps } from "@/types/integrations";

export default async function InterceptedIntegrationModal({
  params,
}: IntegrationDetailPageProps) {
  const { id } = await params;
  const integration = await fetchIntegration(id);

  if (!integration) {
    notFound();
  }

  return <IntegrationModal integration={integration} />;
}
