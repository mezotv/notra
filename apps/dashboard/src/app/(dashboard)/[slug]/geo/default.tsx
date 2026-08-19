import PageClient from "./page-client";

async function Default({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PageClient organizationSlug={slug} />;
}
export default Default;
