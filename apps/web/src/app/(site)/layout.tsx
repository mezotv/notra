import type { ReactNode } from "react";
import FooterSection from "@/components/footer-section";
import { Navbar } from "@/components/navbar";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-start bg-background">
      <div className="relative isolate flex w-full flex-col items-center justify-start">
        <div className="relative z-10 mx-auto flex w-full max-w-none flex-col items-start px-4 sm:px-6 md:px-8 lg:max-w-7xl lg:px-0">
          <div className="relative z-10 flex flex-col items-center self-stretch pt-4 pb-8 md:pb-12">
            <Navbar />
            {children}
            <div className="w-full">
              <FooterSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
