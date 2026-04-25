import { OnboardingAccountMenu } from "@/components/onboarding/account-menu";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full">
      <div className="absolute top-4 right-4 z-10">
        <OnboardingAccountMenu />
      </div>
      {children}
    </div>
  );
}
