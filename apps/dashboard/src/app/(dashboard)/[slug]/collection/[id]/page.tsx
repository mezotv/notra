import type { Metadata } from "next";
import { Suspense } from "react";
import { validateOrganizationAccess } from "@/lib/auth/actions";
import PageClient from "./page-client";

interface PageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "Collection",
  description: "View all posts in a content collection.",
};

async function Page({ params }: PageProps) {
  const { slug, id } = await params;
  const { organization } = await validateOrganizationAccess(slug);

  return (
    <Suspense>
      <PageClient
        collectionId={id}
        organizationId={organization.id}
        organizationSlug={slug}
      />
    </Suspense>
  );
}
export default Page;
