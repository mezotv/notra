import { BLOG_POST_SUBTYPES } from "@notra/db/constants/content";
import type { BlogPostSubtype } from "@notra/db/types/content";

export function isBlogPostSubtype(value: string): value is BlogPostSubtype {
  return BLOG_POST_SUBTYPES.some((subtype) => subtype === value);
}
