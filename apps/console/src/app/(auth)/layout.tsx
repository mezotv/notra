import { headers } from "next/headers";
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
    <div className="flex min-h-svh w-full justify-center lg:grid lg:grid-cols-2">
      <div className="relative hidden p-8 lg:flex">
        <div className="corner-squircle relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_25%_25%,oklch(0.6056_0.2189_292.7172/0.75),transparent_42%),radial-gradient(circle_at_75%_75%,oklch(0.709_0.1592_293.5412/0.55),transparent_45%),hsl(233_7%_8%)] supports-[corner-shape:squircle]:rounded-2xl">
          <div className="space-y-3 px-12 text-center text-white">
            <p className="font-semibold text-4xl tracking-tight">
              Notra Console
            </p>
            <p className="mx-auto max-w-md text-white/70">
              Manage organization integrations without a Notra subscription.
            </p>
          </div>
        </div>
      </div>

      <section className="flex min-h-svh flex-col items-center justify-between p-4">
        <div className="self-start">
          <span className="font-semibold">Notra Console</span>
        </div>
        <div className="w-full max-w-md">{children}</div>
        <p className="px-8 text-center text-muted-foreground text-xs">
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
      </section>
    </div>
  );
}
