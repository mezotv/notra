import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { EmailFooter } from "../components/footer";
import type { ContentChatAnnouncementProps } from "../types/marketing-chat";
import { EMAIL_CONFIG } from "../utils/config";

const ContentChatAnnouncement = ({
  organizationSlug,
  recipientName,
  appUrl,
  siteUrl,
  logoUrl,
  heroImageUrl,
  unsubscribeUrl,
}: ContentChatAnnouncementProps) => {
  const baseAppUrl = appUrl ?? EMAIL_CONFIG.getAppUrl();
  const resolvedSiteUrl = siteUrl ?? EMAIL_CONFIG.getSiteUrl();
  const resolvedLogoUrl = logoUrl ?? `${resolvedSiteUrl}/icon1.png`;
  const chatUrl = `${baseAppUrl}/${organizationSlug}/chat`;
  const firstName = recipientName?.trim().split(/\s+/)[0];
  const greetingTarget =
    firstName && firstName.length > 0 ? firstName : "there";
  const resolvedHeroImageUrl =
    heroImageUrl ??
    `${resolvedSiteUrl}/marketing/chat?name=${encodeURIComponent(greetingTarget)}`;

  return (
    <Html dir="ltr" lang="en">
      <Tailwind>
        <Head />
        <Preview>
          Content Chat is live. A writing tool you can actually push back on.
        </Preview>
        <Body className="bg-[#f7f5f3] py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] overflow-hidden rounded-[8px] bg-white">
            <Section className="px-[32px] pt-[32px] pb-[24px]">
              <Img
                alt="Notra"
                className="mx-auto"
                height="40"
                src={resolvedLogoUrl}
                width="40"
              />
            </Section>

            <Section className="px-[32px] pb-[32px]">
              <Heading className="mb-[24px] text-center font-bold text-[#020304] text-[28px] leading-[1.3]">
                Content Chat is live
              </Heading>

              <Text className="mb-[24px] text-[#020304] text-[16px] leading-[1.6]">
                Hey {greetingTarget},
              </Text>

              <Text className="mb-[24px] text-[#020304] text-[16px] leading-[1.6]">
                We just shipped Content Chat. It's a chat for writing posts,
                where you stay in control instead of getting a one-shot wall of
                generated text.
              </Text>

              <Img
                alt="Content Chat"
                className="mb-[32px] h-auto w-full rounded-[8px] object-cover"
                src={resolvedHeroImageUrl}
              />

              <Text className="mb-[16px] text-[#020304] text-[16px] leading-[1.6]">
                A few things you can do:
              </Text>

              <Text className="mb-[8px] ml-[16px] text-[#020304] text-[16px] leading-[1.6]">
                • Ask for a draft, then iterate line by line
              </Text>
              <Text className="mb-[8px] ml-[16px] text-[#020304] text-[16px] leading-[1.6]">
                • Push back on tone without starting over
              </Text>
              <Text className="mb-[24px] ml-[16px] text-[#020304] text-[16px] leading-[1.6]">
                • Pull context from your PRs, commits, and Linear tickets
              </Text>

              <Section className="mb-[32px] text-center">
                <Button
                  className="box-border rounded-[8px] bg-[#8b5cf6] px-[32px] py-[16px] font-medium text-[16px] text-white no-underline"
                  href={chatUrl}
                >
                  Try Content Chat
                </Button>
              </Section>

              <Text className="mb-[24px] text-[#020304] text-[16px] leading-[1.6]">
                Try it and tell us what's broken. Hit reply, we read every
                email.
              </Text>

              <Text className="text-[#020304] text-[16px] leading-[1.6]">
                Dominik
                <br />
                Notra
              </Text>
            </Section>

            <Section className="px-[32px] pb-[24px]">
              <EmailFooter unsubscribeUrl={unsubscribeUrl} />
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

ContentChatAnnouncement.PreviewProps = {
  organizationSlug: "acme",
  organizationName: "Acme",
  recipientName: "Dominik",
  appUrl: "https://app.usenotra.com",
  siteUrl: "https://usenotra.com",
  logoUrl: "https://usenotra.com/icon1.png",
  heroImageUrl: "https://usenotra.com/marketing/chat?name=Dominik",
  unsubscribeUrl: "https://app.usenotra.com/acme/settings/notifications",
} satisfies ContentChatAnnouncementProps;

export default ContentChatAnnouncement;
export { ContentChatAnnouncement };
