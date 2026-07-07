import { notFound } from "next/navigation";
import { OnboardingAgentStream } from "@/components/debug/onboarding-agent-stream";

export default function OnboardingAgentDebugPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="font-semibold text-xl">Onboarding agent debug</h1>
        <p className="text-muted-foreground text-sm">
          Runs the eve onboarding agent for a domain and streams the raw session
          events. Dev only.
        </p>
      </div>
      <OnboardingAgentStream />
    </main>
  );
}
