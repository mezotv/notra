import { Notra } from "@notra/ui/components/ui/svgs/notra";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { getLastActiveOrganization, getSession } from "@/lib/auth/actions";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session?.user) {
    const organization = await getLastActiveOrganization();

    if (organization) {
      redirect(`/${organization.slug}`);
    } else {
      redirect("/onboarding");
    }
  }
  return (
    <div className="flex h-screen w-full justify-center lg:grid lg:grid-cols-2">
      <section className="flex h-full min-h-0 w-full flex-col items-center justify-between px-6 py-5 lg:px-10 lg:py-6">
        <Link
          className="flex items-center gap-2 self-start"
          href="https://usenotra.com"
        >
          <span aria-hidden="true">
            <Notra className="size-7" />
          </span>
          <h1 className="font-semibold text-foreground text-lg tracking-tight">
            Notra
          </h1>
        </Link>
        <div className="w-full max-w-md">{children}</div>
        <div>
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
        </div>
      </section>

      <div className="relative hidden lg:flex">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="corner-squircle relative h-full w-full overflow-hidden rounded-xl supports-[corner-shape:squircle]:rounded-2xl">
            <AuthBrandPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
