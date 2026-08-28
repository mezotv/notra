import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { validateOrganizationAccess } from "@/lib/auth/actions";
import { isAgentReadinessEnabledForOrganization } from "@/lib/geo/agent-readiness-flag";
import type { AgentReadinessPageProps } from "@/types/agent-readiness";

import PageClient from "./page-client";
import { AgentReadinessSkeleton } from "./skeleton";

export const metadata: Metadata = {
  title: "Agent Readiness",
};

export const instant = true;

async function PageContent({ params }: AgentReadinessPageProps) {
  const { slug } = await params;
  const { organization } = await validateOrganizationAccess(slug);
  const enabled = await isAgentReadinessEnabledForOrganization(organization.id);
  if (!enabled) {
    notFound();
  }
  return <PageClient organizationSlug={slug} />;
}

function Page({ params }: AgentReadinessPageProps) {
  return (
    <Suspense fallback={<AgentReadinessSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
export default Page;
