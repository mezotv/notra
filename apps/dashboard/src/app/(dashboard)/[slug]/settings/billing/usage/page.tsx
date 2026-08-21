import { redirect } from "next/navigation";

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BillingUsagePage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/${slug}/settings/billing?tab=usage`);
}
