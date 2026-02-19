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
} from "@react-email/components";

import { EmailButton } from "../components/button";
import { EmailFooter } from "../components/footer";
import { EMAIL_CONFIG } from "../utils/config";

interface ScheduledContentFailedEmailProps {
  organizationName: string;
  scheduleName: string;
  reason: string;
  settingsLink: string;
  organizationSlug: string;
}

export const ScheduledContentFailedEmail = ({
  organizationName = "Acme Inc",
  scheduleName = "Weekly Product Updates",
  reason = "No meaningful changes were found in the lookback window.",
  organizationSlug = "acme",
  settingsLink = `https://app.usenotra.com/${organizationSlug}/schedules`,
}: ScheduledContentFailedEmailProps) => {
  const logoUrl = EMAIL_CONFIG.getLogoUrl();

  return (
    <Html>
      <Head />
      <Preview>Your scheduled content generation failed</Preview>
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

            <Heading className="my-6 text-center font-medium text-2xl text-black">
              Scheduled content generation failed
            </Heading>

            <Text className="text-center text-[#737373] text-base leading-relaxed">
              Your <strong>{scheduleName}</strong> schedule in{" "}
              <strong>{organizationName}</strong> was unable to generate
              content.
            </Text>

            <Section className="mt-8">
              <Text className="m-0 text-[#666666] text-[12px] uppercase tracking-wide">
                Reason:
              </Text>
              <Text className="mt-2 mb-0 text-[14px] text-black leading-[22px]">
                {reason}
              </Text>
            </Section>

            <Section className="my-8 text-center">
              <EmailButton href={settingsLink}>View Schedule</EmailButton>
            </Section>

            <Text className="text-[14px] text-black leading-[24px]">
              If the button does not work, copy and paste this URL into your
              browser: <Link href={settingsLink}>{settingsLink}</Link>
            </Text>

            <Section className="mt-8">
              <Text className="m-0 text-center text-[#666666] text-[12px] uppercase tracking-wide">
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

export default ScheduledContentFailedEmail;
