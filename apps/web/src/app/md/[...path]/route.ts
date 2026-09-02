import {
  createDualmarkRouteHandler,
  type DualmarkRouteHandler,
} from "@dualmark/nextjs";

import { MARKDOWN_CACHE_CONTROL } from "@/constants/not-found";
import {
  buildDualmarkCollections,
  buildDualmarkStaticPages,
} from "@/utils/markdown-twins";
import { markdownNotFoundResponse } from "@/utils/not-found";
import { SITE_URL } from "@/utils/urls";

const handler = createDualmarkRouteHandler({
  siteUrl: SITE_URL,
  collections: buildDualmarkCollections(),
  staticPages: buildDualmarkStaticPages(),
  headers: {
    cacheControl: MARKDOWN_CACHE_CONTROL,
  },
});

export const runtime = "nodejs";
export const revalidate = 300;
export const generateStaticParams = handler.generateStaticParams;

export const GET: DualmarkRouteHandler["GET"] = async (request, context) => {
  const response = await handler.GET(request, context);

  if (response.status === 404) {
    return markdownNotFoundResponse();
  }

  return response;
};
