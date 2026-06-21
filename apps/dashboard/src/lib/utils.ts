import { cn as cnfast } from "cnfast";

export const cn = cnfast;

export function generateOrganizationAvatar(slug: string) {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${slug}&backgroundType=gradientLinear,solid`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
