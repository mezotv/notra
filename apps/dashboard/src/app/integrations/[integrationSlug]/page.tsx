import { Effect } from "effect";
import { notFound, redirect } from "next/navigation";
import { resolveIntegrationConnectDeeplink } from "@/lib/integrations/deeplink-resolution";

async function Page({
  params,
}: {
  params: Promise<{
    integrationSlug: string;
  }>;
}) {
  const { integrationSlug } = await params;
  const resolution = await Effect.runPromise(
    resolveIntegrationConnectDeeplink(integrationSlug)
  );

  if (resolution.kind === "not-found") {
    notFound();
  }

  redirect(resolution.path);
}

export default Page;
