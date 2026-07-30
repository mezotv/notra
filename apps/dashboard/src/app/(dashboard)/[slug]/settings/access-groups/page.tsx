import type { Metadata } from "next";
import { Suspense } from "react";
import Loading from "./loading";
import AccessGroupsPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Access groups",
};

export default function AccessGroupsSettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AccessGroupsPageClient />
    </Suspense>
  );
}
