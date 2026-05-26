import type { SiteShellProps } from "../types/site-shell";
import FooterSection from "./footer-section";
import { HeroGradient } from "./hero-gradient";
import { Navbar } from "./navbar";

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-start bg-background">
      <div className="relative isolate flex w-full flex-col items-center justify-start">
        <HeroGradient />
        <div className="relative flex w-full max-w-none flex-col items-start justify-start px-4 sm:px-6 md:px-8 lg:w-7xl lg:max-w-7xl lg:px-0">
          <div className="absolute top-0 left-4 z-0 h-full w-px bg-border/60 [-webkit-mask-image:linear-gradient(to_bottom,transparent,#fff_40vh)] [mask-image:linear-gradient(to_bottom,transparent,#fff_40vh)] sm:left-6 md:left-8 lg:left-0" />
          <div className="absolute top-0 right-4 z-0 h-full w-px bg-border/60 [-webkit-mask-image:linear-gradient(to_bottom,transparent,#fff_40vh)] [mask-image:linear-gradient(to_bottom,transparent,#fff_40vh)] sm:right-6 md:right-8 lg:right-0" />

          <div className="relative z-10 flex flex-col items-center self-stretch pt-2.25 pb-8 md:pb-12">
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
