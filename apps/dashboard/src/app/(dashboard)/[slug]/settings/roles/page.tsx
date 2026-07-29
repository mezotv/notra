import type { Metadata } from "next";
import { Suspense } from "react";
import Loading from "./loading";
import RolesPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Roles",
};

export default function RolesSettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RolesPageClient />
    </Suspense>
  );
}
