import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@notra/ui/lib/utils";

const ctaButtonVariants = cva(
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[-0.015em] outline-none focus-visible:ring-[0.1875rem] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "cta-gradient-primary text-white",
        light: "cta-gradient-light text-[#1e1e1e]",
      },
      size: {
        default: "h-11 px-6 text-base [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 px-8 text-lg [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

function CtaButton({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof ctaButtonVariants>) {
  if (typeof className === "function") {
    const resolveClassName = className;

    return (
      <ButtonPrimitive
        className={(state) =>
          cn(ctaButtonVariants({ variant, size }), resolveClassName(state))
        }
        data-slot="cta-button"
        {...props}
      />
    );
  }

  return (
    <ButtonPrimitive
      className={cn(ctaButtonVariants({ variant, size, className }))}
      data-slot="cta-button"
      {...props}
    />
  );
}

export { CtaButton };
