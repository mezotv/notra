import { LoginForm } from "@/components/auth/login-form";
import { buildOAuthConsentPath, hasSignedOAuthQuery } from "@/utils/oauth";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  let returnTo: string | undefined;

  if (hasSignedOAuthQuery(resolvedSearchParams)) {
    returnTo = buildOAuthConsentPath(resolvedSearchParams);
  } else if (typeof resolvedSearchParams.returnTo === "string") {
    returnTo = resolvedSearchParams.returnTo;
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-md p-6 lg:px-8 lg:py-10">
      <LoginForm returnTo={returnTo} />
    </div>
  );
}
