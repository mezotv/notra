import { integrationsRouter } from "./routers/integrations";
import { reviewRouter } from "./routers/review";

export const consoleRouter = {
  integrations: integrationsRouter,
  review: reviewRouter,
};

export type ConsoleRouter = typeof consoleRouter;
