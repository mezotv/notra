"use client";

import { CarouselProgress } from "@notra/ui/components/ui/carousel-progress";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  AUTH_TESTIMONIAL_INTERVAL_MS,
  AUTH_TESTIMONIALS,
} from "@/constants/auth-testimonials";

export function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const testimonial = AUTH_TESTIMONIALS[activeIndex];
  const isPaused = isHovered || isFocused;

  // biome-ignore lint/correctness/useExhaustiveDependencies: activeIndex intentionally restarts testimonial progress.
  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    if (isPaused) {
      return;
    }

    const startedAt = performance.now();

    const interval = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const nextProgress = Math.min(
        (elapsed / AUTH_TESTIMONIAL_INTERVAL_MS) * 100,
        100
      );

      if (nextProgress >= 100) {
        setProgress(0);
        setActiveIndex(
          (currentIndex) => (currentIndex + 1) % AUTH_TESTIMONIALS.length
        );
      } else {
        setProgress(nextProgress);
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [activeIndex, shouldReduceMotion, isPaused]);

  if (!testimonial) {
    return null;
  }

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: hover and focus only pause the carousel timer, this is not an interactive control
    // biome-ignore lint/a11y/noStaticElementInteractions: hover and focus only pause the carousel timer, this is not an interactive control
    <div
      onBlur={() => {
        setIsFocused(false);
        setProgress(0);
      }}
      onFocus={() => setIsFocused(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setProgress(0);
      }}
    >
      <section
        aria-label="Customer testimonials"
        aria-roledescription="carousel"
        className="flex w-full max-w-xl flex-col gap-5"
      >
        <div aria-live={isPaused || shouldReduceMotion ? "polite" : "off"}>
          <figure
            aria-label={`Testimonial ${activeIndex + 1} of ${AUTH_TESTIMONIALS.length}`}
            aria-roledescription="slide"
            className="fade-in-0 slide-in-from-bottom-2 flex min-h-[15rem] animate-in flex-col justify-between gap-5 rounded-3xl bg-white/10 p-7 shadow-[0_0_0_0.0625rem_rgba(255,255,255,0.2)] duration-500 motion-reduce:animate-none"
            key={activeIndex}
          >
            <blockquote className="text-base text-white leading-relaxed">
              "{testimonial.quote}"
            </blockquote>
            <figcaption className="flex items-center gap-3">
              <Image
                alt={testimonial.name}
                className="size-10 shrink-0 rounded-full object-cover"
                height={40}
                src={testimonial.avatarSrc}
                width={40}
              />
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-white">
                  {testimonial.name}
                </span>
                <span className="text-sm text-violet-100/75">
                  {testimonial.role}
                </span>
              </div>
            </figcaption>
          </figure>
        </div>
        <CarouselProgress
          activeIndex={activeIndex}
          labels={AUTH_TESTIMONIALS.map(
            (item) => `Show testimonial from ${item.name}`
          )}
          onSelect={(index) => {
            setActiveIndex(index);
            setProgress(0);
          }}
          progress={shouldReduceMotion ? 100 : progress}
          variant="inverted"
        />
      </section>
    </div>
  );
}
