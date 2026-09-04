export const DOCS_ORIGIN = "https://docs.usenotra.com";

const FRAMER_PLUGIN_ID = "8d4wmwtko6960jsu3ojmalvqm";

export const FRAMER_PLUGIN_ORIGIN_PATTERN = new RegExp(
  `^https://${FRAMER_PLUGIN_ID}(-[a-zA-Z0-9]+)?\\.plugins\\.framercdn\\.com$`
);

export const LOCAL_DEV_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
