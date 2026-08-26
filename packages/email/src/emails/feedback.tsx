import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { EmailFooter } from "../components/footer";
import type { FeedbackEmailProps } from "../types/feedback";
import { EMAIL_CONFIG } from "../utils/config";
import { FEEDBACK_SENTIMENT_META } from "../utils/feedback";

export const FeedbackEmail = ({
  message = "The new editor feels a lot snappier, but I'd love to see dark mode fixes on the mobile nav.",
  sentiment,
  userName = "Jane Doe",
  userEmail = "jane@example.com",
  organizationName,
  organizationSlug,
  pageUrl,
  userAgent,
}: FeedbackEmailProps) => {
  const logoUrl = EMAIL_CONFIG.getLogoUrl();
  const sentimentMeta = sentiment ? FEEDBACK_SENTIMENT_META[sentiment] : null;

  return (
    <Html>
      <Head />
      <Preview>
        {sentimentMeta ? `${sentimentMeta.emoji} ` : ""}New feedback from{" "}
        {userName}
      </Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[520px] rounded p-[20px]">
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
              {sentimentMeta ? `${sentimentMeta.emoji} ` : ""}New feedback
            </Heading>

            <Section className="mt-6 rounded-md border border-[#eaeaea] border-solid bg-[#fafafa] p-5">
              <Text className="m-0 whitespace-pre-wrap text-[15px] text-black leading-[22px]">
                {message}
              </Text>
            </Section>

            <Section className="mt-8">
              <Text className="m-0 text-[#666666] text-[12px] uppercase tracking-wide">
                From
              </Text>
              <Text className="mt-1 mb-0 text-[14px] text-black leading-[22px]">
                {userName} &lt;{userEmail}&gt;
              </Text>
            </Section>

            {sentimentMeta ? (
              <Section className="mt-4">
                <Text className="m-0 text-[#666666] text-[12px] uppercase tracking-wide">
                  Sentiment
                </Text>
                <Text className="mt-1 mb-0 text-[14px] text-black leading-[22px]">
                  {sentimentMeta.emoji} {sentimentMeta.label}
                </Text>
              </Section>
            ) : null}

            {organizationName ? (
              <Section className="mt-4">
                <Text className="m-0 text-[#666666] text-[12px] uppercase tracking-wide">
                  Organization
                </Text>
                <Text className="mt-1 mb-0 text-[14px] text-black leading-[22px]">
                  {organizationName}
                  {organizationSlug ? ` (${organizationSlug})` : ""}
                </Text>
              </Section>
            ) : null}

            {pageUrl ? (
              <Section className="mt-4">
                <Text className="m-0 text-[#666666] text-[12px] uppercase tracking-wide">
                  Page
                </Text>
                <Text className="mt-1 mb-0 break-all text-[14px] text-black leading-[22px]">
                  {pageUrl}
                </Text>
              </Section>
            ) : null}

            {userAgent ? (
              <Section className="mt-4">
                <Text className="m-0 text-[#666666] text-[12px] uppercase tracking-wide">
                  User agent
                </Text>
                <Text className="mt-1 mb-0 break-all text-[#666666] text-[12px] leading-[18px]">
                  {userAgent}
                </Text>
              </Section>
            ) : null}

            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default FeedbackEmail;
