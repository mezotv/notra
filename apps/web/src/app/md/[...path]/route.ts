import { createDualmarkRouteHandler } from "@dualmark/nextjs";
import {
  buildDualmarkCollections,
  buildDualmarkStaticPages,
} from "@/utils/markdown-twins";
import { SITE_URL } from "@/utils/urls";

const handler = createDualmarkRouteHandler({
  siteUrl: SITE_URL,
  collections: buildDualmarkCollections(),
  staticPages: buildDualmarkStaticPages(),
  headers: {
    cacheControl: "public, max-age=300",
  },
});

export const runtime = "nodejs";
export const revalidate = 300;
export const GET = handler.GET;
export const generateStaticParams = handler.generateStaticParams;
