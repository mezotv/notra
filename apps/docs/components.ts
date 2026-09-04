import { defineComponents } from "blume";

import DocsFooter from "./src/components/docs-footer.astro";

export default defineComponents({
  layout: { Footer: DocsFooter },
});
