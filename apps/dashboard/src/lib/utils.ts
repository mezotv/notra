import { cn as cnfast } from "cnfast";

export const cn = cnfast;

export function generateOrganizationAvatar(slug: string) {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${slug}&backgroundType=gradientLinear,solid`;
}

export function errorMessageOr(
  message: string | null | undefined,
  fallback: string
): string {
  return message || fallback;
}
