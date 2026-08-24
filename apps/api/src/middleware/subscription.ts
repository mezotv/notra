import { PAID_OR_LEGACY_PLAN_IDS } from "@notra/ai/billing/features";
import { Autumn } from "autumn-js";
import type { Context, Next } from "hono";
import { getOrganizationId } from "../utils/auth";

// DELETE and GET are intentionally unrestricted so lapsed/unsubscribed orgs
// retain read access and data-deletion rights (GDPR / data portability).
const RESTRICTED_METHODS = new Set(["POST", "PUT", "PATCH"]);

const AI_CREDITS_FEATURE_ID = "ai_credits";

export function subscriptionMiddleware() {
  return async (c: Context, next: Next) => {
    if (!RESTRICTED_METHODS.has(c.req.method)) {
      return next();
    }

    const secretKey = c.env.AUTUMN_SECRET_KEY as string | undefined;
    if (!secretKey) {
      console.error(
        "AUTUMN_SECRET_KEY is not configured — rejecting write request"
      );
      return c.json({ error: "Billing service unavailable" }, 503);
    }

    const orgId = getOrganizationId(c);
    if (!orgId) {
      return c.json(
        { error: "Forbidden: API key must be scoped to an organization" },
        403
      );
    }

    const autumn = new Autumn({ secretKey });

    try {
      const customer = await autumn.customers.getOrCreate({
        customerId: orgId,
      });

      let hasAccess = customer.subscriptions.some(
        (subscription) =>
          !subscription.addOn &&
          subscription.status === "active" &&
          PAID_OR_LEGACY_PLAN_IDS.has(subscription.planId)
      );

      if (!hasAccess) {
        const check = await autumn.check({
          customerId: orgId,
          featureId: AI_CREDITS_FEATURE_ID,
          requiredBalance: 1,
        });
        hasAccess = check.allowed === true;
      }

      if (!hasAccess) {
        return c.json({ error: "Active subscription required" }, 402);
      }
    } catch {
      return c.json({ error: "Failed to verify subscription status" }, 500);
    }

    return next();
  };
}
