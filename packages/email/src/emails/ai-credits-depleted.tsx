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
import type { AiCreditsDepletedEmailProps } from "../types/ai-credits-depleted";
import { EMAIL_CONFIG } from "../utils/config";

export const AiCreditsDepletedEmail = ({
  organizationName = "Acme Inc",
  organizationSlug = "acme",
  automationName = "Weekly Product Updates",
  creditsLink = `${EMAIL_CONFIG.getAppUrl()}/${organizationSlug}/settings/credits`,
}: AiCreditsDepletedEmailProps) => {
  const logoUrl = EMAIL_CONFIG.getLogoUrl();

  return (
    <Html>
      <Head />
      <Preview>Your Notra AI credits are depleted</Preview>
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
              AI credits are depleted
            </Heading>

            <Text className="text-center text-[#737373] text-base leading-relaxed">
              Your <strong>{automationName}</strong> automation in{" "}
              <strong>{organizationName}</strong> did not run because your AI
              credit balance is empty.
            </Text>

            <Section className="my-8 text-center">
              <EmailButton href={creditsLink}>Add AI Credits</EmailButton>
            </Section>

            <Text className="text-[14px] text-black leading-[24px]">
              If the button does not work, copy and paste this URL into your
              browser: <Link href={creditsLink}>{creditsLink}</Link>
            </Text>

            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
