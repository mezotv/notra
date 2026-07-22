import {
  Marquee,
  MarqueeContent,
  MarqueeItem,
} from "@notra/ui/components/kibo-ui/marquee";
import {
  MARQUEE_CAPTION,
  MARQUEE_EDGE_MASK,
  MARQUEE_LOGOS,
} from "@/constants/landing/marquee-quote";

export function LogoMarquee() {
  return (
    <section className="flex flex-col items-center gap-12 px-6 pt-16 pb-12 antialiased sm:px-12 lg:gap-12 lg:px-20 lg:pt-20 lg:pb-13">
      <p className="text-center font-display font-medium text-[#1E1E1E80] text-base/6 tracking-[-0.01em] dark:text-white/50">
        {MARQUEE_CAPTION}
      </p>
      <Marquee
        className="text-[#6B7280] dark:text-[#9CA3AF]"
        style={{
          maskImage: MARQUEE_EDGE_MASK,
          WebkitMaskImage: MARQUEE_EDGE_MASK,
        }}
      >
        <MarqueeContent pauseOnHover={false} speed={40}>
          {MARQUEE_LOGOS.map(({ name, Logo }) => (
            <MarqueeItem className="mx-8 sm:mx-14 lg:mx-22.25" key={name}>
              <Logo className="h-9 w-auto shrink-0 sm:h-10 lg:h-10.5" />
            </MarqueeItem>
          ))}
        </MarqueeContent>
      </Marquee>
    </section>
  );
}
