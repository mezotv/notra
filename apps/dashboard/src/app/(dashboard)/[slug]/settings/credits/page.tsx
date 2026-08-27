import type { Metadata } from "next";
import { Suspense } from "react";

import Loading from "../../loading";
import CreditsPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Credits",
};

export const instant = true;

export default function CreditsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CreditsPageClient />
    </Suspense>
  );
}
