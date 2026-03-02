import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@notra/ui/lib/utils";

const smoothButtonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-lg font-semibold text-white text-[0.8125rem] outline-none transition-all duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary to-primary/85 shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.08),0_1px_1.5px_rgba(0,0,0,0.32),0_0_0_0.5px_var(--color-primary)] hover:from-primary/90 hover:to-primary/80 focus-visible:ring-[3px] focus-visible:ring-primary/50",
        destructive:
          "bg-gradient-to-b from-[#ff4444] to-[#e03030] shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.08),0_1px_1.5px_rgba(0,0,0,0.32),0_0_0_0.5px_#ff4444] hover:from-[#ff5555] hover:to-[#e84040] focus-visible:ring-[3px] focus-visible:ring-red-400/50",
        success:
          "bg-gradient-to-b from-[#22c55e] to-[#16a34a] shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.08),0_1px_1.5px_rgba(0,0,0,0.32),0_0_0_0.5px_#22c55e] hover:from-[#34d46e] hover:to-[#1eb854] focus-visible:ring-[3px] focus-visible:ring-green-400/50",
      },
      size: {
        default: "h-8 gap-1.5 px-4",
        xs: "h-6 gap-1 rounded-md px-2 text-xs",
        sm: "h-7 gap-1 rounded-md px-3 text-xs",
        lg: "h-9 gap-2 px-5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function SmoothButton({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof smoothButtonVariants>) {
  return (
    <ButtonPrimitive
      className={cn(smoothButtonVariants({ variant, size, className }))}
      data-slot="button"
      {...props}
    />
  );
}

export { SmoothButton, smoothButtonVariants };
