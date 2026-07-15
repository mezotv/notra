import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-8 p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          alt=""
          className="size-10"
          height={40}
          priority
          src="/notra-mark.svg"
          width={40}
        />
        <span className="font-semibold text-lg tracking-tight">
          Notra Console
        </span>
      </div>

      <div className="w-full max-w-md">{children}</div>

      <p className="max-w-md text-center text-muted-foreground text-xs">
        Notra Console reuses your existing Notra account. Use the same email and
        password you use for the Notra dashboard.{" "}
        <Link
          className="underline underline-offset-4 hover:text-primary"
          href="https://app.usenotra.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          Open the Notra dashboard
        </Link>
        .
      </p>

      <p className="text-center text-muted-foreground text-xs">
        By continuing, you agree to our{" "}
        <Link
          className="underline underline-offset-4 hover:text-primary"
          href="https://usenotra.com/terms"
          rel="noopener noreferrer"
          target="_blank"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          className="underline underline-offset-4 hover:text-primary"
          href="https://usenotra.com/privacy"
          rel="noopener noreferrer"
          target="_blank"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
