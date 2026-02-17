import { ResetPasswordClient } from "./page-client";

interface PageProps {
  searchParams?: {
    token?: string | string[];
    error?: string | string[];
  };
}

export default function ResetPasswordPage({ searchParams }: PageProps) {
  const tokenParam = searchParams?.token;
  const errorParam = searchParams?.error;

  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  return <ResetPasswordClient error={error} token={token} />;
}
