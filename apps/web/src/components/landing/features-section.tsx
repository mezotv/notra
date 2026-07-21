import { cn } from "@notra/ui/lib/utils";
import {
  FEATURES_ASSETS_COPY,
  FEATURES_AUTOMATIONS_COPY,
  FEATURES_BRAND_COPY,
  FEATURES_HEADING,
  FEATURES_PUBLISH_COPY,
  FEATURES_SUBCOPY_LINE_ONE,
  FEATURES_SUBCOPY_LINE_TWO,
} from "@/constants/landing/features";
import type { FeaturesCardShellProps } from "@/types/landing/features";
import { FeaturesCardAssets } from "./features-card-assets";
import { FeaturesCardAutomations } from "./features-card-automations";
import { FeaturesCardBrand } from "./features-card-brand";
import { FeaturesCardPublish } from "./features-card-publish";
import { FeaturesShader } from "./features-shader";

function FeaturesCard({
  copy,
  shaderColorFront,
  shaderClassName,
  containerClassName,
  className,
  children,
}: FeaturesCardShellProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-start overflow-clip rounded-[0.8125rem] bg-[linear-gradient(in_oklab_180deg,oklab(95.1%_0.011_-0.018_/_15%)_0%,oklab(93.7%_0.019_-0.031_/_75%)_100%)] p-8.75 [box-shadow:#0A0D1408_0rem_0.0625rem_0.125rem,#0A0D1408_0rem_0.0625rem_0.125rem,#ECECEC_0rem_0rem_0rem_0.0625rem] dark:bg-none dark:bg-white/[0.02] dark:[box-shadow:#0A0D1408_0rem_0.0625rem_0.125rem,#0A0D1408_0rem_0.0625rem_0.125rem,#FFFFFF14_0rem_0rem_0rem_0.0625rem]",
        className
      )}
    >
      <FeaturesShader
        className={cn("h-161.5 w-186.5", shaderClassName)}
        colorFront={shaderColorFront}
      />
      <div className={cn("relative shrink-0", containerClassName)}>
        <div className="absolute top-0 left-0 z-10 flex w-full flex-col items-start gap-1.5 lg:w-110.25">
          <h3 className="font-medium font-sans text-[#0A0D14] text-[1.5625rem]/8 tracking-[-0.015em] lg:h-8 dark:text-white">
            {copy.title}
          </h3>
          <p className="w-full font-medium font-sans text-[#6A6B70] text-base/6 lg:w-102 dark:text-white/60">
            {copy.description}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="mx-auto flex w-full max-w-360 flex-col items-center px-6 pt-20 antialiased [font-synthesis:none] lg:px-20 lg:pt-35">
      <div className="flex w-full flex-col items-center gap-13.5">
        <header className="flex flex-col items-center gap-4">
          <h2 className="text-center font-display font-medium text-[2.25rem] text-black leading-[1.15] tracking-[-0.02em] lg:text-[3.0625rem]/14 dark:text-white">
            {FEATURES_HEADING}
          </h2>
          <p className="w-full max-w-206.25 text-balance text-center font-display font-medium text-[#1E1E1EBF] text-xl/7.5 tracking-[-0.01em] dark:text-white/70">
            {FEATURES_SUBCOPY_LINE_ONE}
            <br />
            {FEATURES_SUBCOPY_LINE_TWO}
          </p>
        </header>
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
          <FeaturesCard
            containerClassName="h-98.25 w-full lg:w-110.25"
            copy={FEATURES_BRAND_COPY}
            shaderClassName="-top-13.25 -left-1.5"
            shaderColorFront="#1809FF21"
          >
            <FeaturesCardBrand />
          </FeaturesCard>
          <FeaturesCard
            className="lg:h-115.75"
            containerClassName="h-112.5 w-full lg:w-110.25"
            copy={FEATURES_AUTOMATIONS_COPY}
            shaderClassName="-top-13.25 -left-px"
            shaderColorFront="#FF001021"
          >
            <FeaturesCardAutomations />
          </FeaturesCard>
          <FeaturesCard
            containerClassName="h-98.25 w-full lg:self-stretch"
            copy={FEATURES_ASSETS_COPY}
            shaderClassName="-top-13.25 left-px"
            shaderColorFront="#00FF3821"
          >
            <FeaturesCardAssets />
          </FeaturesCard>
          <FeaturesCard
            containerClassName="h-98.25 w-full lg:w-110.25"
            copy={FEATURES_PUBLISH_COPY}
            shaderClassName="-top-4.5 -left-px"
            shaderColorFront="#FFEA0040"
          >
            <FeaturesCardPublish />
          </FeaturesCard>
        </div>
      </div>
    </section>
  );
}
