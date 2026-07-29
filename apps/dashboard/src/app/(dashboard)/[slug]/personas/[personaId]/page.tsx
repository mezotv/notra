import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Persona",
};

async function Page({
  params,
}: {
  params: Promise<{ slug: string; personaId: string }>;
}) {
  const { slug, personaId } = await params;
  return <PageClient personaId={personaId} slug={slug} />;
}

export default Page;
