import { Suspense } from "react";
import PageClient from "./page-client";
import { GeoPageSkeleton } from "./skeleton";

export const instant = true;

async function DefaultContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PageClient organizationSlug={slug} />;
}

function Default({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<GeoPageSkeleton />}>
      <DefaultContent params={params} />
    </Suspense>
  );
}
export default Default;
