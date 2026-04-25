import { db } from "@notra/db/drizzle";
import { brandSettings, connectedSocialAccounts } from "@notra/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  getAllUserOrganizations,
  getLastActiveOrganization,
  getSession,
} from "@/lib/auth/actions";
import { hasPaidSubscriptionHistory } from "@/lib/billing/subscription";
import { SocialsClient } from "./socials-client";

export default async function OnboardingSocialsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const allOrgs = await getAllUserOrganizations(session.user.id);
  for (const org of allOrgs) {
    if (await hasPaidSubscriptionHistory(org.id)) {
      redirect(`/${org.slug}`);
    }
  }

  const organization = await getLastActiveOrganization(session.user.id);
  if (!organization) {
    redirect("/onboarding/workspace");
  }

  const [defaultBrand, twitterAccount] = await Promise.all([
    db.query.brandSettings.findFirst({
      where: and(
        eq(brandSettings.organizationId, organization.id),
        eq(brandSettings.isDefault, true)
      ),
      columns: { id: true },
    }),
    db.query.connectedSocialAccounts.findFirst({
      where: and(
        eq(connectedSocialAccounts.organizationId, organization.id),
        eq(connectedSocialAccounts.provider, "twitter")
      ),
      columns: {
        createdAt: true,
        displayName: true,
        id: true,
        profileImageUrl: true,
        provider: true,
        providerAccountId: true,
        username: true,
        verified: true,
      },
      orderBy: [desc(connectedSocialAccounts.createdAt)],
    }),
  ]);

  return (
    <SocialsClient
      initialAccount={
        twitterAccount
          ? {
              ...twitterAccount,
              createdAt: twitterAccount.createdAt.toISOString(),
            }
          : null
      }
      organizationId={organization.id}
      voiceId={defaultBrand?.id ?? null}
    />
  );
}
