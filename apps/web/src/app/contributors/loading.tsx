import { ContributorsPageSkeleton } from "@/components/contributors/skeleton";

export default function Loading() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
      <section className="flex w-full items-center justify-center px-6 py-12 md:px-24 md:py-16">
        <div className="flex w-full max-w-[586px] flex-col items-center gap-4">
          <h1 className="text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
            Contributors & <span className="text-primary">community</span>
          </h1>
          <p className="text-center font-normal font-sans text-base text-muted-foreground leading-7">
            Meet the developers who build Notra. Browse open issues, check in on
            pull requests, and jump in anytime.
          </p>
        </div>
      </section>
      <ContributorsPageSkeleton />
    </div>
  );
}
