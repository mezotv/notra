import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/actions";
import { MarketingChatAdminClient } from "./page-client";

export const metadata: Metadata = {
  title: "Marketing Chat Email",
  robots: { index: false, follow: false },
};

export default async function MarketingChatAdminPage() {
  await requireAuth();
  return <MarketingChatAdminClient />;
}
