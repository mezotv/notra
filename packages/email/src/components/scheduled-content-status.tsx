import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

import type { ScheduledContentStatusTemplateProps } from "../types/scheduled-content-status";
import { EMAIL_CONFIG } from "../utils/config";
import { EmailButton } from "./button";
import { EmailFooter } from "./footer";
import { EmailLogo } from "./logo";

export const ScheduledContentStatusEmail = ({
  organizationName,
  scheduleName,
  reason,
  settingsLink,
  organizationSlug,
  status,
}: ScheduledContentStatusTemplateProps) => {
  const failed = status === "failed";
  const statusLabel = failed ? "failed" : "was skipped";

  return (
    <Html>
      <Head />
      <Preview>Your scheduled content generation {statusLabel}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded p-[20px]">
            <EmailLogo />

            <Heading className="my-6 text-center text-2xl font-medium text-black">
              Scheduled content generation {statusLabel}
            </Heading>

            <Text className="text-center text-base leading-relaxed text-[#737373]">
              Your <strong>{scheduleName}</strong> schedule in{" "}
              <strong>{organizationName}</strong>{" "}
              {failed
                ? "was unable to generate content."
                : "ran successfully, but did not create content."}
            </Text>

            <Section className="mt-8">
              <Text className="m-0 text-[12px] tracking-wide text-[#666666] uppercase">
                Reason:
              </Text>
              <Text className="mt-2 mb-0 text-[14px] leading-[22px] text-black">
                {reason}
              </Text>
            </Section>

            <Section className="my-8 text-center">
              <EmailButton href={settingsLink}>View Schedule</EmailButton>
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
