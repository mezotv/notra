import { notFound, redirect } from "next/navigation";
import { getLastActiveOrganization, getSession } from "@/lib/auth/actions";
import {
  buildIntegrationConnectLoginUrl,
  buildOrganizationIntegrationConnectPath,
  decodeIntegrationSlugParam,
} from "@/lib/integrations/deeplink";
import { storeIntegrationDeeplinkSlugSchema } from "@/schemas/integrations";

async function Page({
  params,
}: {
  params: Promise<{
    integrationSlug: string;
  }>;
}) {
  const { integrationSlug } = await params;
  const parsed = storeIntegrationDeeplinkSlugSchema.safeParse(
    decodeIntegrationSlugParam(integrationSlug)
  );

  if (!parsed.success) {
    notFound();
  }

  const session = await getSession();

  if (!session?.user) {
    redirect(buildIntegrationConnectLoginUrl(parsed.data));
  }

  const organization = await getLastActiveOrganization();

  if (!organization) {
    redirect("/onboarding");
  }

  redirect(
    buildOrganizationIntegrationConnectPath(organization.slug, parsed.data)
  );
}

export default Page;
