import { cn } from "@notra/ui/lib/utils";
import Image from "next/image";
import { TestimonialsShader } from "@/components/landing/testimonials-shader";
import {
  FEATURED_TESTIMONIAL,
  PAIR_TESTIMONIALS,
  TESTIMONIALS_SUBHEADING,
} from "@/constants/landing/testimonials";
import type { Testimonial } from "@/types/landing/testimonials";

const AVATAR_SIZE = 56;

interface TestimonialCardProps {
  testimonial: Testimonial;
  featured?: boolean;
}

function TestimonialCard({
  testimonial,
  featured = false,
}: TestimonialCardProps) {
  return (
    <article
      className={cn(
        "relative flex w-full flex-1 flex-col overflow-clip rounded-3xl p-8 backdrop-blur-[0.375rem] sm:p-12 lg:px-16 lg:py-20",
        "[box-shadow:#ECECEC_0_0_0_0.0625rem,#28282814_0_0.0625rem_0.125rem] dark:bg-none dark:bg-white/[0.03] dark:[box-shadow:#FFFFFF14_0_0_0_0.0625rem,#00000014_0_0.0625rem_0.125rem]",
        featured
          ? "bg-[linear-gradient(in_oklab_180deg,oklab(95.1%_0.011_-0.018_/_20%)_0%,oklab(91.7%_0.017_-0.029_/_50%)_100%)]"
          : "bg-[linear-gradient(in_oklab_180deg,oklab(95.1%_0.011_-0.018_/_20%)_0%,oklab(93.7%_0.019_-0.031_/_50%)_100%)]"
      )}
    >
      <TestimonialsShader
        className={testimonial.shader.className}
        colorFront={testimonial.shader.colorFront}
        size={testimonial.shader.size}
      />
      <div
        className={cn(
          "relative z-10 flex flex-col gap-14",
          !featured && "min-h-[25rem] justify-between"
        )}
      >
        <p className="min-w-0 self-stretch font-medium font-sans text-[#1E1E1E] text-[1.5625rem]/8 tracking-[-0.015em] dark:text-foreground">
          {testimonial.quote}
        </p>
        <div className="flex items-center gap-4">
          <div className="size-14 shrink-0 overflow-hidden rounded-full border border-[#1E1E1E40] bg-white dark:border-white/20">
            <Image
              alt={testimonial.avatarAlt}
              className="size-full object-cover"
              height={AVATAR_SIZE}
              src={testimonial.avatar}
              width={AVATAR_SIZE}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium font-sans text-[#1E1E1E] text-base/5.5 dark:text-foreground">
              {testimonial.name}
            </span>
            <span className="font-display text-[#1E1E1EBF] text-base/5.5 dark:text-muted-foreground">
              {testimonial.role}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function TestimonialsSection() {
  return (
    <section className="flex w-full flex-col items-center gap-13.5 px-6 pt-24 pb-27.5 lg:pt-70">
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-center font-display font-medium text-4xl/tight text-black tracking-[-0.02em] lg:text-[3.0625rem]/14 dark:text-foreground">
          Shipping, without the <span className="text-primary">busywork</span>.
        </h2>
        <p className="max-w-[31.875rem] text-center font-display font-medium text-[#1E1E1EBF] text-xl/7.5 tracking-[-0.01em] dark:text-muted-foreground">
          {TESTIMONIALS_SUBHEADING}
        </p>
      </div>
      <div className="flex w-full max-w-[80rem] flex-col items-start gap-8">
        <TestimonialCard featured testimonial={FEATURED_TESTIMONIAL} />
        <div className="flex w-full flex-col gap-8 lg:flex-row">
          {PAIR_TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
