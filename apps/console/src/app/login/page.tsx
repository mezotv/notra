import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getServerSession } from "@/lib/auth/session";

const ERROR_MESSAGES: Record<string, string> = {
  "social-sign-in-failed": "Social sign-in failed. Please try again.",
  banned: "Your account has been suspended.",
};

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await getServerSession();

  if (user) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;

  const readParam = (key: string) => {
    const value = resolvedSearchParams[key];
    return typeof value === "string" ? value : undefined;
  };

  const returnTo = readParam("returnTo");
  const verify = readParam("verify");
  const email = readParam("email");
  const errorKey = readParam("error");

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="mx-auto w-full max-w-md rounded-md p-6 lg:px-8 lg:py-10">
        <LoginForm
          initialError={errorKey ? ERROR_MESSAGES[errorKey] : undefined}
          initialPendingVerification={
            verify
              ? { pendingAuthenticationToken: verify, email: email ?? "" }
              : undefined
          }
          returnTo={returnTo}
        />
      </div>
    </div>
  );
}
