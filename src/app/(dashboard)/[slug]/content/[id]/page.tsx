import type { Metadata } from "next";
import { Suspense } from "react";
import { getContentById } from "./content-data";
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
  const { id } = await params;
  const content = getContentById(id);

  return {
    title: content?.title ?? "Content Detail",
  };
}

async function Page({ params }: PageProps) {
  const { slug, id } = await params;

  return (
    <Suspense>
      <PageClient contentId={id} organizationSlug={slug} />
    </Suspense>
  );
}
export default Page;
