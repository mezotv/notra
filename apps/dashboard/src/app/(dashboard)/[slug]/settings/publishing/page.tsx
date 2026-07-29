import type { Metadata } from "next";
import { Suspense } from "react";
import Loading from "./loading";
import PublishingPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Publishing",
};

export default function PublishingSettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PublishingPageClient />
    </Suspense>
  );
}
