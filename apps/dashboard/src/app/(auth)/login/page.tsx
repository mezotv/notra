import { LoginForm } from "@/components/auth/login-form";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-md rounded-md p-6 lg:px-8 lg:py-10">
      <LoginForm returnTo={returnTo} />
    </div>
  );
}
