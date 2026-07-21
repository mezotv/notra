import {
  MARQUEE_CAPTION,
  MARQUEE_EDGE_MASK,
  MARQUEE_LOGOS,
} from "@/constants/landing/marquee-quote";

const MARQUEE_STYLES = `
.notra-logo-marquee-track {
  animation: notra-logo-marquee 42s linear infinite;
}
@keyframes notra-logo-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .notra-logo-marquee-track {
    animation: none;
  }
}
`;

function LogoRow({ hidden }: { hidden: boolean }) {
  return (
    <div
      aria-hidden={hidden}
      className="flex shrink-0 items-center gap-16 pr-16 sm:gap-28 sm:pr-28 lg:gap-44.5 lg:pr-44.5"
    >
      {MARQUEE_LOGOS.map(({ name, Logo }) => (
        <Logo className="h-9 w-auto shrink-0 sm:h-10 lg:h-10.5" key={name} />
      ))}
    </div>
  );
}

export function LogoMarquee() {
  return (
    <section className="flex flex-col items-center gap-12 px-6 pt-16 pb-12 antialiased sm:px-12 lg:gap-12 lg:px-20 lg:pt-20 lg:pb-13">
      <style>{MARQUEE_STYLES}</style>
      <p className="text-center font-display font-medium text-[#1E1E1E80] text-base/6 tracking-[-0.01em] dark:text-white/50">
        {MARQUEE_CAPTION}
      </p>
      <div
        className="relative w-full overflow-hidden text-[#6B7280] dark:text-[#9CA3AF]"
        style={{
          maskImage: MARQUEE_EDGE_MASK,
          WebkitMaskImage: MARQUEE_EDGE_MASK,
        }}
      >
        <div className="notra-logo-marquee-track flex w-max">
          <LogoRow hidden={false} />
          <LogoRow hidden={true} />
        </div>
      </div>
    </section>
  );
}
