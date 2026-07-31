import { XVerifiedBadge } from "@notra/ui/components/ui/svgs/twitter";
import { XVerifiedGoldBadge } from "@/components/icons/x-verified-gold-badge";
import { XVerifiedGovernmentBadge } from "@/components/icons/x-verified-government-badge";
import type { XVerificationBadgeProps } from "@/types/content/twitter-post";

export function XVerificationBadge({
  verified,
  verifiedType,
  className,
}: XVerificationBadgeProps) {
  if (!verified) {
    return null;
  }
  if (verifiedType === "business") {
    return <XVerifiedGoldBadge className={className} />;
  }
  if (verifiedType === "government") {
    return <XVerifiedGovernmentBadge className={className} />;
  }
  return <XVerifiedBadge className={className} />;
}
