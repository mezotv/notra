import type { ReactNode } from "react";
import FooterSection from "@/components/footer-section";
import { Navbar } from "@/components/navbar";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-start bg-background">
      <div className="relative isolate flex w-full flex-col items-stretch justify-start">
        <Navbar />
        {children}
        <FooterSection />
      </div>
    </div>
  );
}
