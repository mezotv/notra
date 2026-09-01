import type { Metadata } from "next";

import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "GEO directions",
};

export const instant = true;

function Page() {
  return <PageClient />;
}

export default Page;
