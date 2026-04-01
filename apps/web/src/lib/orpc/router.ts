import { marketplaceRouter } from "./routers/marketplace";

export const webRouter = {
  marketplace: marketplaceRouter,
};

export type WebRouter = typeof webRouter;
