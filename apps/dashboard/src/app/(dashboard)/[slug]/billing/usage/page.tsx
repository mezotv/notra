import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BillingUsagePage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/${slug}/billing?tab=usage`);
}
