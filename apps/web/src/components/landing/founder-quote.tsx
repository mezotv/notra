import Image from "next/image";

import { FOUNDER_QUOTE } from "@/constants/landing/marquee-quote";

const AVATAR_SIZE = 56;

export function FounderQuote() {
  const { quote, name, role, avatarSrc, avatarAlt } = FOUNDER_QUOTE;

  return (
    <section className="flex flex-col items-center gap-10.5 px-6 pt-24 pb-24 antialiased sm:px-12 lg:px-20 lg:pt-40 lg:pb-35">
      <blockquote className="max-w-[48.25rem] text-center font-sans text-[1.875rem] leading-[1.15] font-medium tracking-[-0.02em] text-balance text-[#1E1E1E] sm:text-[2.25rem] lg:text-[2.4375rem] lg:leading-[2.875rem] dark:text-white">
        {quote}
      </blockquote>
      <figcaption className="flex items-center gap-4">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-white">
          <Image
            alt={avatarAlt}
            className="size-full object-cover"
            height={AVATAR_SIZE}
            src={avatarSrc}
            width={AVATAR_SIZE}
          />
        </span>
        <span className="flex flex-col items-start gap-2">
          <span className="font-sans text-base/5.5 font-medium text-[#1E1E1E] dark:text-white">
            {name}
          </span>
          <span className="font-display text-base/5.5 text-[#1E1E1EBF] dark:text-white/70">
            {role}
          </span>
        </span>
      </figcaption>
    </section>
  );
}
