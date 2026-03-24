import { apiKeysRouter } from "./routers/api-keys";
import { automationRouter } from "./routers/automation";
import { brandRouter } from "./routers/brand";
import { contentRouter } from "./routers/content";
import { githubRouter } from "./routers/github";
import { integrationsRouter } from "./routers/integrations";
import { logsRouter } from "./routers/logs";
import { notificationsRouter } from "./routers/notifications";
import { onboardingRouter } from "./routers/onboarding";
import { socialAccountsRouter } from "./routers/social-accounts";
import { uploadRouter } from "./routers/upload";
import { userRouter } from "./routers/user";

export const dashboardRouter = {
  apiKeys: apiKeysRouter,
  automation: automationRouter,
  brand: brandRouter,
  content: contentRouter,
  github: githubRouter,
  integrations: integrationsRouter,
  logs: logsRouter,
  notifications: notificationsRouter,
  onboarding: onboardingRouter,
  socialAccounts: socialAccountsRouter,
  upload: uploadRouter,
  user: userRouter,
};

export type DashboardRouter = typeof dashboardRouter;
