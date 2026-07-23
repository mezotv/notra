import { CtaButton } from "@notra/ui/components/shared/cta-button";
import Link from "next/link";
import { DeferredDithering } from "@/components/deferred-dithering";
import { TrackedSignupLink } from "@/components/tracked-signup-link";
import {
  CTA_BANNER_CONTACT_HREF,
  CTA_BANNER_HEADING,
  CTA_BANNER_PRIMARY_LABEL,
  CTA_BANNER_SECONDARY_LABEL,
  CTA_BANNER_SIGNUP_SOURCE,
  CTA_BANNER_SUBCOPY,
} from "@/constants/landing/cta-banner";

export function CtaBanner() {
  return (
    <div className="relative mx-auto flex min-h-[27.4375rem] w-full max-w-[87rem] shrink-0 items-center justify-center overflow-clip rounded-[1.5625rem] bg-[#C8B2EE40] px-6 py-16 antialiased dark:bg-[#231d3a]">
      <DeferredDithering
        className="-top-66.25 absolute left-[-5.368rem] h-264.5 w-403.25"
        colorBack="#00000000"
        colorFront="#8B5CF62D"
        scale={0.53}
        shape="wave"
        size={2.9}
        speed={0.7}
        type="4x4"
      />
      <div className="relative flex w-full max-w-[53.3125rem] flex-col items-center gap-10.5">
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-4.5">
            <h2 className="max-w-[46.625rem] text-balance text-center font-display font-medium text-[#1E1E1E] text-[2.5rem] leading-[114%] tracking-[-0.125rem] sm:text-[3rem] lg:text-[4rem] dark:text-white">
              {CTA_BANNER_HEADING}
            </h2>
            <p className="max-w-[33.5rem] text-balance text-center font-medium font-sans text-[#1E1E1EE6] text-lg/5.5 tracking-[-0.03125rem] dark:text-white/85">
              {CTA_BANNER_SUBCOPY}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-7">
          <CtaButton
            className="text-lg"
            nativeButton={false}
            render={<TrackedSignupLink source={CTA_BANNER_SIGNUP_SOURCE} />}
            variant="primary"
          >
            {CTA_BANNER_PRIMARY_LABEL}
          </CtaButton>
          <CtaButton
            className="text-lg"
            nativeButton={false}
            render={<Link href={CTA_BANNER_CONTACT_HREF} />}
            variant="light"
          >
            {CTA_BANNER_SECONDARY_LABEL}
          </CtaButton>
        </div>
      </div>
    </div>
  );
}
