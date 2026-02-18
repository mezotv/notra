import { ResetPasswordClient } from "./page-client";

interface PageProps {
  searchParams?: Promise<{
    token?: string | string[];
    error?: string | string[];
  }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const tokenParam = resolvedSearchParams.token;
  const errorParam = resolvedSearchParams.error;

  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  return <ResetPasswordClient error={error} token={token} />;
}
