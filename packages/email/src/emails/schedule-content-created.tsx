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
import type { ScheduledContentCreatedEmailProps } from "../types/schedule-content-created";
import { EMAIL_CONFIG } from "../utils/config";

const CONTENT_TYPE_MAP: Record<string, string> = {
  changelog: "Changelog",
  blog_post: "Blog Post",
  linkedin_post: "LinkedIn Post",
  twitter_post: "Twitter Post",
  investor_update: "Investor Update",
};

export const ScheduledContentCreatedEmail = ({
  organizationName = "Acme Inc",
  scheduleName = "Weekly Product Updates",
  createdContent = [
    {
      title: "This week's product updates are live",
      contentLink: "https://app.usenotra.com/acme/content/example-post-id",
    },
  ],
  contentType = "changelog",
  organizationSlug = "acme",
  contentOverviewLink = `https://app.usenotra.com/${organizationSlug}/content`,
}: ScheduledContentCreatedEmailProps) => {
  const logoUrl = EMAIL_CONFIG.getLogoUrl();
  const contentCount = createdContent.length;
  const primaryContent = createdContent[0];
  const contentLabel = CONTENT_TYPE_MAP[contentType] ?? "Content";
  const summary =
    contentCount === 1
      ? `just created a new ${contentLabel} draft.`
      : `just created ${contentCount} new ${contentLabel} drafts.`;

  return (
    <Html>
      <Head />
      <Preview>Your scheduled content is ready in Notra</Preview>
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
              New scheduled content is ready
            </Heading>

            <Text className="text-center text-[#737373] text-base leading-relaxed">
              Your <strong>{scheduleName}</strong> schedule in{" "}
              <strong>{organizationName}</strong> {summary}
            </Text>

            <Section className="mt-8">
              <Text className="m-0 text-[#666666] text-[12px] uppercase tracking-wide">
                {contentCount === 1 ? "Content title:" : "Created drafts:"}
              </Text>
              {createdContent.map((item) => (
                <Text
                  className="mt-2 mb-0 text-[14px] text-black leading-[22px]"
                  key={item.contentLink}
                >
                  <Link href={item.contentLink}>{item.title}</Link>
                </Text>
              ))}
            </Section>

            <Section className="my-8 text-center">
              <EmailButton
                href={
                  contentCount === 1
                    ? (primaryContent?.contentLink ?? contentOverviewLink)
                    : contentOverviewLink
                }
              >
                {contentCount === 1 ? "Review Content" : "Review All Content"}
              </EmailButton>
            </Section>

            <Text className="text-[14px] text-black leading-[24px]">
              If the button does not work, copy and paste this URL into your
              browser:{" "}
              <Link
                href={
                  contentCount === 1
                    ? (primaryContent?.contentLink ?? contentOverviewLink)
                    : contentOverviewLink
                }
              >
                {contentCount === 1
                  ? (primaryContent?.contentLink ?? contentOverviewLink)
                  : contentOverviewLink}
              </Link>
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

export default ScheduledContentCreatedEmail;
