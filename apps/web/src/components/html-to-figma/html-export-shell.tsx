import HtmlExportTool from "@/components/html-to-figma/html-export-tool";
import type { HtmlExportShellProps } from "@/types/html-to-figma";

export default function HtmlExportShell({
  target,
  title,
  subtitle,
}: HtmlExportShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-start px-4 pt-24 pb-24 text-left antialiased [font-synthesis:none] sm:px-6 sm:pt-28 md:px-8 md:pt-32 lg:px-12">
      <h1 className="max-w-3xl text-left font-display font-medium text-[#1E1E1E] text-[2.25rem] leading-[1.08] tracking-[-0.02em] sm:text-[3rem] dark:text-white">
        {title}
      </h1>

      <p className="mt-5 max-w-2xl text-left font-medium font-sans text-[#1E1E1EBF] text-base leading-7 sm:text-lg dark:text-white/70">
        {subtitle}
      </p>

      <section className="mt-10 w-full rounded-3xl border border-[#1E1E1E14] bg-[linear-gradient(in_oklab_180deg,oklab(95.1%_0.011_-0.018_/_15%)_0%,oklab(93.7%_0.019_-0.031_/_75%)_100%)] p-4 sm:p-6 dark:border-white/10 dark:bg-none dark:bg-white/[0.02]">
        <HtmlExportTool target={target} />
      </section>
    </div>
  );
}
