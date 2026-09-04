import {
  DOCS_ORIGIN,
  FRAMER_PLUGIN_ORIGIN_PATTERN,
  LOCAL_DEV_ORIGIN_PATTERN,
} from "../constants/cors";

export function getAllowedOrigin(
  origin: string | undefined,
  isProduction = process.env.NODE_ENV === "production"
): string | null {
  if (!origin) {
    return null;
  }

  if (
    origin === DOCS_ORIGIN ||
    FRAMER_PLUGIN_ORIGIN_PATTERN.test(origin) ||
    (!isProduction && LOCAL_DEV_ORIGIN_PATTERN.test(origin))
  ) {
    return origin;
  }

  return null;
}
