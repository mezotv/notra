"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/container";
import { ChatSection } from "@/components/settings/chat-section";
import { ConnectedAccountsSection } from "@/components/settings/connected-accounts-section";
import { DeleteAccountSection } from "@/components/settings/delete-account";
import { LoginDetailsSection } from "@/components/settings/login-details-section";
import { OrganizationsSection } from "@/components/settings/organizations-section";
import { PrivacySection } from "@/components/settings/privacy-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { authClient } from "@/lib/auth/client";
import type { Account } from "@/types/settings/account";
import { AccountPageSkeleton } from "./skeleton";

export default function SettingsAccountPage() {
  const router = useRouter();
  const {
    data: session,
    isPending: isSessionPending,
    refetch: refetchSession,
  } = authClient.useSession();
  const user = session?.user;

  const {
    data: accounts,
    refetch: refetchAccounts,
    isError: isAccountsError,
  } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const result = await authClient.listAccounts();
      if (result.error) {
        throw new Error(result.error.message ?? "Failed to load accounts");
      }
      return (result.data ?? []) as Account[];
    },
    enabled: !!user,
  });

  if (!user && isSessionPending) {
    return <AccountPageSkeleton />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const hasGoogleLinked = accounts?.some((a) => a.providerId === "google");
  const hasGithubLinked = accounts?.some((a) => a.providerId === "github");
  const hasPasswordAccount = accounts?.some(
    (a) => a.providerId === "credential"
  );

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Account</h1>
          <p className="text-muted-foreground">
            Manage your profile and account settings
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ProfileSection onSessionRefetch={refetchSession} user={user} />
          <LoginDetailsSection
            email={user.email}
            hasPasswordAccount={hasPasswordAccount ?? false}
          />
          <ConnectedAccountsSection
            accounts={accounts ?? []}
            hasGithubLinked={hasGithubLinked ?? false}
            hasGoogleLinked={hasGoogleLinked ?? false}
            isError={isAccountsError}
            onAccountsChange={refetchAccounts}
          />
          <OrganizationsSection />
          <PrivacySection />
          <ChatSection />
          <DeleteAccountSection />
        </div>
      </div>
    </PageContainer>
  );
}
