import { cn } from "@notra/ui/lib/utils";
import { INTEGRATIONS_CONNECT_URL } from "@/constants/integrations";

const PRIMARY_CLASSNAME = "cta-gradient-primary-flat text-white";

export function IntegrationConnectButton({
  className,
  label = "Connect",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <a
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-sans font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        PRIMARY_CLASSNAME,
        className
      )}
      href={INTEGRATIONS_CONNECT_URL}
    >
      {label}
    </a>
  );
}
