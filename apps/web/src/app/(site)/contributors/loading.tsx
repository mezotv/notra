import { ContributorsPageSkeleton } from "@/components/contributors/skeleton";

export default function Loading() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
      <div className="mb-12 flex w-full flex-col items-center gap-4 rounded-[1.5625rem] border border-[#1E1E1E14] bg-[#C8B2EE40] px-6 py-16 md:mb-16 md:px-24 md:py-24 dark:border-white/10 dark:bg-[#231d3a]">
        <div className="flex w-full max-w-[36.625rem] flex-col items-center gap-4">
          <h1 className="text-balance text-center font-display font-medium text-4xl text-[#1E1E1E] leading-[1.05] tracking-[-0.02em] md:text-6xl dark:text-white">
            Contributors & <span className="text-primary">Community</span>
          </h1>
          <p className="text-balance text-center font-medium font-sans text-[#1E1E1EBF] text-lg leading-7 dark:text-white/70">
            Meet the developers who build Notra. Browse open issues, check in on
            pull requests, and jump in anytime.
          </p>
        </div>
      </div>
      <ContributorsPageSkeleton />
    </div>
  );
}
