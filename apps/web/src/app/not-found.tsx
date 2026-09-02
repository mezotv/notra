import Link from "next/link";

import FooterSection from "@/components/footer-section";
import { Navbar } from "@/components/navbar";
import { NOT_FOUND_AGENT_LINKS } from "@/constants/not-found";

export default function NotFound() {
  return (
    <div className="bg-background relative flex min-h-svh w-full flex-col items-center justify-start">
      <div className="relative isolate flex w-full flex-col items-stretch justify-start">
        <Navbar />
        <div className="flex min-h-[80svh] w-full flex-col items-center justify-center gap-8 px-6">
          <div className="flex flex-col items-center gap-2">
            <span className="text-foreground font-serif text-[8rem] leading-none tracking-tight sm:text-[12rem] md:text-[16rem]">
              404
            </span>
            <p className="text-foreground font-serif text-xl sm:text-2xl">
              This page doesn&apos;t exist yet.
            </p>
          </div>
          <Link
            className="text-primary hover:text-primary/80 font-sans text-sm underline underline-offset-4 transition-colors"
            href="/"
          >
            Back to home
          </Link>
          <nav
            aria-label="Site indexes"
            className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-sans text-xs"
          >
            <span>Looking for an index?</span>
            {NOT_FOUND_AGENT_LINKS.map((link) => (
              <a
                className="hover:text-foreground underline underline-offset-4 transition-colors"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <FooterSection />
      </div>
    </div>
  );
}
