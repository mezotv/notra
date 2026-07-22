import { HeroDither } from "@/components/landing/hero-dither";
import { McpCommandTabs } from "@/components/mcp/mcp-command-tabs";
import type { McpHeroProps } from "@/types/mcp";

export function McpHero({ subhead }: McpHeroProps) {
  return (
    <section className="w-full px-6 pt-6 antialiased [font-synthesis:none]">
      <div className="relative isolate overflow-clip rounded-3xl bg-[#EFEAFA] dark:bg-[#2a2140]">
        <div className="pointer-events-none absolute inset-0 overflow-clip rounded-3xl">
          <HeroDither className="-top-1.25 -left-10.75 absolute h-[66.125rem] w-[calc(100%+21.5rem)] min-w-[100.8125rem] bg-[#00000000]" />
        </div>

        <div className="relative flex w-full flex-col items-center gap-10 px-6 pt-20 pb-20 lg:pt-24">
          <div className="flex flex-col items-center gap-6">
            <h1 className="max-w-[51.25rem] text-center font-display font-medium text-[#1E1E1E] text-[2.5rem] leading-[1.12] tracking-[-0.015em] sm:text-[3.25rem] lg:text-[4rem] dark:text-white">
              Notra, for your <span className="text-primary">agent</span>.
            </h1>
            <p className="max-w-[38.75rem] text-center font-medium font-sans text-[#1E1E1EBF] text-[1.0625rem] leading-[1.42] tracking-[-0.005em] sm:text-[1.1875rem] dark:text-white/70">
              {subhead}
            </p>
          </div>
          <McpCommandTabs className="max-w-[45rem]" />
        </div>
      </div>
    </section>
  );
}
