import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { EmailButton } from "../components/button";
import { EmailFooter } from "../components/footer";
import type {
  WorkflowPausedEmailProps,
  WorkflowPausedReason,
} from "../types/workflow-paused";
import { EMAIL_CONFIG } from "../utils/config";

function getReasonCopy(reason: WorkflowPausedReason) {
  if (reason === "ai_credits_depleted") {
    return "Your AI credit balance was empty for 3 automated runs in a row.";
  }

  if (reason === "plan_limit_reached") {
    return "Your plan's monthly content limit was reached for 3 automated runs in a row.";
  }

  return "This workflow failed 3 automated runs in a row.";
}

export const WorkflowPausedEmail = ({
  organizationName = "Acme Inc",
  organizationSlug = "acme",
  automationName = "Weekly Product Updates",
  reason = "workflow_errors",
  settingsLink = `${EMAIL_CONFIG.getAppUrl()}/${organizationSlug}/automation/schedules`,
}: WorkflowPausedEmailProps) => {
  const logoUrl = EMAIL_CONFIG.getLogoUrl();

  return (
    <Html>
      <Head />
      <Preview>Your Notra workflow was paused</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded p-[20px]">
            <Section className="mt-[32px]">
              <Img
                alt="Notra Logo"
                className="mx-auto"
                height="40"
                src={logoUrl}
                width="40"
              />
            </Section>

            <Heading className="my-6 text-center text-2xl font-medium text-black">
              Workflow paused
            </Heading>

            <Text className="text-center text-base leading-relaxed text-[#737373]">
              Your <strong>{automationName}</strong> workflow in{" "}
              <strong>{organizationName}</strong> was paused automatically.
            </Text>

            <Section className="mt-8">
              <Text className="m-0 text-[12px] tracking-wide text-[#666666] uppercase">
                Reason:
              </Text>
              <Text className="mt-2 mb-0 text-[14px] leading-[22px] text-black">
                {getReasonCopy(reason)}
              </Text>
            </Section>

            <Section className="my-8 text-center">
              <EmailButton href={settingsLink}>Review Workflow</EmailButton>
            </Section>

            <Text className="text-[14px] leading-[24px] text-black">
              If the button does not work, copy and paste this URL into your
              browser: <Link href={settingsLink}>{settingsLink}</Link>
            </Text>

            <Section className="mt-8">
              <Text className="m-0 text-center text-[12px] tracking-wide text-[#666666] uppercase">
                If you don't want to receive these emails, you can click{" "}
                <Link
                  href={`${EMAIL_CONFIG.getAppUrl()}/${organizationSlug}/settings/notifications`}
                >
                  here
                </Link>{" "}
                to update your notification settings.
              </Text>
            </Section>

            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
