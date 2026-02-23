import type { Metadata } from "next";
import { Suspense } from "react";
import { validateOrganizationAccess } from "@/lib/auth/actions";
import { getGitHubIntegrationById } from "@/lib/services/github-integration";
import PageClient from "./page-client";

interface PageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, id } = await params;
  const { organization } = await validateOrganizationAccess(slug);
  const integration = await getGitHubIntegrationById(id);

  if (!integration || integration.organizationId !== organization.id) {
    return { title: "Integration" };
  }

  return {
    title: `${integration.displayName} Integration`,
  };
}

async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense>
      <PageClient integrationId={id} />
    </Suspense>
  );
}
export default Page;
