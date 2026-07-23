import {
  getLiveMcpStoreIntegrationById,
  getLiveMcpStoreIntegrationBySlug,
} from "@notra/ai/integrations/mcp-store";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  buildOrganizationIntegrationsPath,
  decodeIntegrationSlugParam,
} from "@/lib/integrations/deeplink";
import { storeIntegrationDeeplinkSlugSchema } from "@/schemas/integrations";
import PageClient from "../page-client";

export const metadata: Metadata = {
  title: "Integrations",
};

async function Page({
  params,
}: {
  params: Promise<{
    slug: string;
    integrationSlug: string;
  }>;
}) {
  const { slug, integrationSlug } = await params;
  const parsed = storeIntegrationDeeplinkSlugSchema.safeParse(
    decodeIntegrationSlugParam(integrationSlug)
  );

  if (!parsed.success) {
    redirect(buildOrganizationIntegrationsPath(slug));
  }

  const storeIntegration =
    (await getLiveMcpStoreIntegrationBySlug(parsed.data)) ??
    (await getLiveMcpStoreIntegrationById(parsed.data));

  if (!storeIntegration) {
    redirect(buildOrganizationIntegrationsPath(slug));
  }

  return (
    <Suspense>
      <PageClient connectSlug={parsed.data} organizationSlug={slug} />
    </Suspense>
  );
}

export default Page;
