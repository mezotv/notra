import {
  saveOnboardingAttribution,
  triggerOnboardingAgentSetup,
  triggerOnboardingBrandAnalysis,
} from "@/app/onboarding/workspace/actions";
import { authClient } from "@/lib/auth/client";
import { generateOrganizationAvatar } from "@/lib/utils";
import { onboardingWorkspaceSchema } from "@/schemas/onboarding/workspace";
import type { SubmitWorkspaceFormArgs } from "@/types/onboarding";
import { setLastVisitedOrganization } from "@/utils/cookies";

export async function submitWorkspaceForm({
  existingOrg,
  value,
}: SubmitWorkspaceFormArgs) {
  const parsed = onboardingWorkspaceSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Please check your inputs"
    );
  }

  let organizationId: string;

  if (existingOrg) {
    organizationId = existingOrg.id;
  } else {
    const { data, error } = await authClient.organization.create({
      name: parsed.data.name,
      slug: parsed.data.slug,
      logo: generateOrganizationAvatar(parsed.data.slug),
    });

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create org");
    }

    organizationId = data.id;

    await authClient.organization.setActive({
      organizationId: data.id,
    });
    await setLastVisitedOrganization(data.slug);
  }

  const hasAttribution = Boolean(
    parsed.data.heardAboutNotraSource || parsed.data.heardAboutNotraOther
  );
  const attributionAlreadyRecorded = Boolean(
    existingOrg?.heardAboutNotraSource || existingOrg?.heardAboutNotraOther
  );

  if (hasAttribution && !attributionAlreadyRecorded) {
    const attributionPromise = saveOnboardingAttribution({
      heardAboutNotraOther: parsed.data.heardAboutNotraOther,
      heardAboutNotraSource: parsed.data.heardAboutNotraSource,
      organizationId,
    });

    attributionPromise
      .then((result) => {
        if (!result.success) {
          console.error("[Onboarding] Failed to save attribution", {
            organizationId,
            error: result.error,
          });
        }
      })
      .catch((error) => {
        console.error("[Onboarding] Failed to save attribution", {
          organizationId,
          error,
        });
      });
  }

  if (parsed.data.websiteUrl) {
    try {
      await triggerOnboardingBrandAnalysis({
        organizationId,
        websiteUrl: parsed.data.websiteUrl,
        name: parsed.data.name,
      });
    } catch (error) {
      console.error("[Onboarding] Background brand analysis failed", {
        organizationId,
        error,
      });
    }
  }

  try {
    await triggerOnboardingAgentSetup({
      organizationId,
      websiteUrl: parsed.data.websiteUrl || undefined,
    });
  } catch (error) {
    console.error("[Onboarding] Background onboarding agent setup failed", {
      organizationId,
      error,
    });
  }
}
