import { apiKeysRouter } from "./routers/api-keys";
import { attachmentsRouter } from "./routers/attachments";
import { automationRouter } from "./routers/automation";
import { brandRouter } from "./routers/brand";
import { contentRouter } from "./routers/content";
import { feedbackRouter } from "./routers/feedback";
import { githubRouter } from "./routers/github";
import { integrationsRouter } from "./routers/integrations";
import { logsRouter } from "./routers/logs";
import { notificationsRouter } from "./routers/notifications";
import { onboardingRouter } from "./routers/onboarding";
import { reviewsRouter } from "./routers/reviews";
import { rolesRouter } from "./routers/roles";
import { searchRouter } from "./routers/search";
import { skillsRouter } from "./routers/skills";
import { socialAccountsRouter } from "./routers/social-accounts";
import { uploadRouter } from "./routers/upload";
import { userRouter } from "./routers/user";

export const dashboardRouter = {
  apiKeys: apiKeysRouter,
  attachments: attachmentsRouter,
  automation: automationRouter,
  brand: brandRouter,
  content: contentRouter,
  feedback: feedbackRouter,
  github: githubRouter,
  integrations: integrationsRouter,
  logs: logsRouter,
  notifications: notificationsRouter,
  onboarding: onboardingRouter,
  reviews: reviewsRouter,
  roles: rolesRouter,
  search: searchRouter,
  skills: skillsRouter,
  socialAccounts: socialAccountsRouter,
  upload: uploadRouter,
  user: userRouter,
};

export type DashboardRouter = typeof dashboardRouter;
