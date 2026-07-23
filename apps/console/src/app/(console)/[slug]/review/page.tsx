import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CurationClient } from "@/components/review/curation-client";
import { ReviewQueueClient } from "@/components/review/review-queue-client";
import { validateOrganizationAccess } from "@/lib/auth/actions";
import { hasAdminRole } from "@/lib/auth/role";

export const metadata: Metadata = {
  title: "Review Queue · Notra Console",
};

export default async function ReviewQueuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user } = await validateOrganizationAccess(slug);

  if (!hasAdminRole(user.role)) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-10">
      <ReviewQueueClient />
      <CurationClient />
    </div>
  );
}
