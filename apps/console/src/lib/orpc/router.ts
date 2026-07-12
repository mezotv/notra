import { integrationsRouter } from "./routers/integrations";

export const consoleRouter = {
  integrations: integrationsRouter,
};

export type ConsoleRouter = typeof consoleRouter;
