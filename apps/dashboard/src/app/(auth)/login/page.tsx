import { LoginForm } from "@/components/auth/login-form";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const returnTo =
    typeof resolvedSearchParams.returnTo === "string"
      ? resolvedSearchParams.returnTo
      : undefined;

  return (
    <div className="mx-auto w-full max-w-md rounded-md p-6 lg:px-8 lg:py-10">
      <LoginForm returnTo={returnTo} />
    </div>
  );
}
