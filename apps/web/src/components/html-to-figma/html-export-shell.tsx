import HtmlExportTool from "@/components/html-to-figma/html-export-tool";
import type { HtmlExportShellProps } from "@/types/html-to-figma";

export default function HtmlExportShell({
  target,
  title,
  subtitle,
}: HtmlExportShellProps) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start px-4 pt-24 pb-16 text-left sm:px-6 sm:pt-28 md:px-8 md:pt-32 lg:px-12">
        <h1 className="max-w-3xl text-left font-sans font-semibold text-4xl text-foreground leading-[1.05] tracking-tight sm:text-5xl">
          {title}
        </h1>

        <p className="mt-5 max-w-2xl text-left font-sans text-base text-muted-foreground leading-7">
          {subtitle}
        </p>

        <section className="mt-10 w-full border-border border-t pt-10">
          <HtmlExportTool target={target} />
        </section>
      </div>
      <div className="w-full border-border border-t" />
    </>
  );
}
