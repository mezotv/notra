import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

  return <ReviewQueueClient />;
}
