import type { ReactNode } from "react";

import FooterSection from "@/components/footer-section";
import { Navbar } from "@/components/navbar";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-svh w-full flex-col items-center justify-start">
      <div className="relative isolate flex w-full flex-col items-stretch justify-start">
        <Navbar />
        {children}
        <FooterSection />
      </div>
    </div>
  );
}
