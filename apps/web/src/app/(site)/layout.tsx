import type { ReactNode } from "react";
import FooterSection from "@/components/footer-section";
import { Navbar } from "@/components/navbar";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh w-full flex-col items-stretch justify-start bg-background">
      <div className="relative isolate flex w-full flex-col items-stretch justify-start">
        <Navbar />
        <main className="flex w-full flex-col items-center pb-8 md:pb-12">
          {children}
        </main>
        <FooterSection />
      </div>
    </div>
  );
}
