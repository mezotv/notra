import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "HTML Gallery",
};

function Page() {
  return <PageClient />;
}

export default Page;
